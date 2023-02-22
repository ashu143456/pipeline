import { App, Fn, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { PipelineStack } from "../lib/pipeline-stack";

jest.useRealTimers();
jest.setTimeout(10 * 100000);

test('Pipeline Stack', Fn=>{
    const app = new App();
    const stack = new PipelineStack(app,'MyPipelineTest');
    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
})