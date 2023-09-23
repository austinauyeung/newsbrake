import * as cdk from 'aws-cdk-lib/core';
import { Stack } from 'aws-cdk-lib';
import { aws_wafv2 as wafv2 } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

interface WafStackProps extends cdk.StackProps {
    stage: apigw.Stage,
}

export class WafStack extends Stack {
    constructor(scope: cdk.Stage, id: string, props: WafStackProps) {
        super(scope, id, props);

        // WAF
        const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
            scope: 'REGIONAL',
            defaultAction: {
                block: {}
            },
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
                metricName: 'WebACLMetric'
            },
            rules: [
                {
                    name: 'geoMatchRule',
                    priority: 0,
                    statement: {
                        geoMatchStatement: {
                            countryCodes: ["US", "CA"]
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        sampledRequestsEnabled: true,
                        metricName: 'WebACLGeoMatch'
                    },
                    action: { allow: {} },
                },
                {
                    name: 'rateLimitRule',
                    priority: 1,
                    statement: {
                        rateBasedStatement: {
                            aggregateKeyType: 'IP',
                            limit: 200,
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        sampledRequestsEnabled: true,
                        metricName: 'WebACLRateLimit'
                    },
                    action: { block: {} }
                }
            ]
        })

        new wafv2.CfnWebACLAssociation(this, 'WebAclAssocation', {
            webAclArn: webAcl.attrArn,
            resourceArn: props.stage.stageArn
        })
    }
}