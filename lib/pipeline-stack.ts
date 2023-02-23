import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, "Pipeline",{
      pipelineName: "Pipeline",
      crossAccountKeys: false
    });

    const cdksourceOutput = new Artifact('CDKSourceOutput');
    const servicesourceOutput = new Artifact('ServiceSourceOutput');

    pipeline.addStage({
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

    const cdkBuildOutput = new Artifact('CdkBuildOutput')

    pipeline.addStage({
      stageName: "Build",
      actions:[new CodeBuildAction({
        actionName: 'CDK_Build',
        input: cdksourceOutput,
        outputs:[cdkBuildOutput],
        project: new PipelineProject(this, 'CdkBuildProject',{
          environment:{
            buildImage: LinuxBuildImage.STANDARD_5_0
          },
          buildSpec: BuildSpec.fromSourceFilename("build-specs/cdk-build-spec.yml")
        })
      })]
    });

    pipeline.addStage({
      stageName: "Pipeline_Update",
      actions:[new CloudFormationCreateUpdateStackAction({
        actionName: 'Pipeline_update',
        stackName: "PipelineStack",
        templatePath: cdkBuildOutput.atPath('PipelineStack.template.json'),
        adminPermissions: true
      }),
    ],
    });
  }
}
