import { App, Fn, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { Budget } from "../../lib/constructs/budget";
jest.useRealTimers();
jest.setTimeout(10 * 100000);

test("Budget construct", Fn=> {
    const app = new App();
    const stack = new Stack(app, "Stack");
    new Budget(stack, "Budget",{
        budgetamount:1,
        emailaddress:"test@example.com"
    });

    Template.fromStack(stack).hasResourceProperties("AWS::Budgets::Budget",{
        Budget:{
            BudgetLimit:{
                Amount:1,
            },
        },
        NotificationsWithSubscribers:[
            Match.objectLike({
                Subscribers:[
                    {
                        Address: "test@example.com",
                        SubscriptionType: "EMAIL",
                    },
                ],
            }),
        ],
    })
});