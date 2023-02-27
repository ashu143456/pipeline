#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';
import { BillingStack } from '../lib/billing-stack';
import { ServiceStack } from '../lib/server-stack';

const app = new cdk.App();
const pipelineStack = new PipelineStack(app, 'PipelineStack', {});
new BillingStack(app, 'BillingStack', {
  budgetamount: 5,
  emailaddress: 'ashu143456@gmail.com'
});

const serviceStackProd = new ServiceStack(app, "ServiceStackProd",{});
pipelineStack.addServiceStage(serviceStackProd,"Prod")