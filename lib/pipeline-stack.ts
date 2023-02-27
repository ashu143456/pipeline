import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';
import { ServiceStack } from './server-stack';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PipelineStack extends cdk.Stack {
  private readonly pipeline: Pipeline;
  private readonly cdkBuildOutput: Artifact;
  private readonly serviceBuildOutput: Artifact;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.pipeline = new Pipeline(this, "Pipeline",{
      pipelineName: "Pipeline",
      crossAccountKeys: false,
      restartExecutionOnUpdate: true
    });

    const cdksourceOutput = new Artifact('CDKSourceOutput');
    const servicesourceOutput = new Artifact('ServiceSourceOutput');

    this.pipeline.addStage({
      stageName: 'Source',
      actions:[
        new GitHubSourceAction({
          owner: 'ashu143456',
          repo: 'pipeline',
          branch: 'master',
          actionName: 'Pipeline_Source',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: cdksourceOutput
        }),
        new GitHubSourceAction({
          owner: 'ashu143456',
          repo: 'sincerepo',
          branch: 'master',
          actionName: 'Service_Source',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: servicesourceOutput
        }),
      ],
    });

    this.cdkBuildOutput = new Artifact('CdkBuildOutput');
    this.serviceBuildOutput = new Artifact('ServiceBuildOutput')

    this.pipeline.addStage({
      stageName: "Build",
      actions:[
        new CodeBuildAction({
        actionName: 'CDK_Build',
        input: cdksourceOutput,
        outputs:[this.cdkBuildOutput],
        project: new PipelineProject(this, 'CdkBuildProject',{
          environment:{
            buildImage: LinuxBuildImage.STANDARD_5_0
          },
          buildSpec: BuildSpec.fromSourceFilename("build-specs/cdk-build-spec.yml"),
        }),        
      }),
        new CodeBuildAction({
        actionName: 'Service_Build',
        input: servicesourceOutput,
        outputs:[this.serviceBuildOutput],
        project: new PipelineProject(this, 'ServiceBuildProject',{
          environment:{
            buildImage: LinuxBuildImage.STANDARD_5_0
          },
          buildSpec: BuildSpec.fromSourceFilename("build-specs/service-build-spec.yml"),
        }),
      }),
    ]
    });

    this.pipeline.addStage({
      stageName: "Pipeline_Update",
      actions:[new CloudFormationCreateUpdateStackAction({
        actionName: 'Pipeline_update',
        stackName: "PipelineStack",
        templatePath: this.cdkBuildOutput.atPath('PipelineStack.template.json'),
        adminPermissions: true
      }),
    ],
    });
  }
  public addServiceStage(servicestack:ServiceStack, stageName: string){
    this.pipeline.addStage({
      stageName: stageName,
      actions:[new CloudFormationCreateUpdateStackAction({
        actionName: 'Service_update',
        stackName: servicestack.stackName,
        templatePath: this.cdkBuildOutput.atPath(`${servicestack.stackName}.template.json`),
        adminPermissions: true,
        parameterOverrides:{
          ...servicestack.serviceCode.assign(this.serviceBuildOutput.s3Location)
        },
        extraInputs:[this.serviceBuildOutput]
  }),
],
});
}
}
