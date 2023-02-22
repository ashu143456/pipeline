import {Stack, StackProps} from "aws-cdk-lib";
import { Construct } from "constructs";
import { Budget } from "./constructs/budget";

interface BillingStackProps extends StackProps{
    budgetamount: number,
    emailaddress: string
}
export class BillingStack extends Stack{
    constructor(scope: Construct, id: string, props: BillingStackProps) {
        super(scope, id, props);

        new Budget(this, 'Budget', {
            budgetamount: props.budgetamount,
            emailaddress: props.emailaddress
        }) 
    }
}