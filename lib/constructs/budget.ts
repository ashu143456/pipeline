import { CfnBudget } from "aws-cdk-lib/aws-budgets";
import { Construct } from "constructs";

interface BudgetProps{
    budgetamount: number,
    emailaddress: string
}

export class Budget extends Construct{
    constructor(scope: Construct, id: string, props: BudgetProps){
        super(scope, id);

        new CfnBudget(this, "Budget", {
            budget:{
                budgetLimit:{
                    amount: props.budgetamount,
                    unit: 'USD'
                },
                budgetName: 'Monthly Budget',
                budgetType: 'COST',
                timeUnit: 'MONTHLY'
            },
            notificationsWithSubscribers:[
                {
                    notification:{
                        notificationType: 'ACTUAL',
                        threshold: 20,
                        comparisonOperator:'GREATER_THAN',
                        thresholdType: 'PERCENTAGE'
                    },
                    subscribers:[{
                            subscriptionType: 'EMAIL',
                            address: props.emailaddress
                    }],
                },
            ],
        });
    }
}