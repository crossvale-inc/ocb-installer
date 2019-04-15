"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    // All time values are expressed in seconds
    ocb: {
        paths: {
            // To fill-up in runtime
            root: "",
            config: "",
            fleetTemplates: "./config/templates",
            ansiblePlaybook: ""
        },
        clusterId: "ocp311ohio",
        clientId: "Crossvale",
        ocp: {
            defaultTimeZone: "America/Chicago",
            sessionToken: "",
            url: "https://kubernetes.default.svc" ,
            skiSslVerification: true,
            roleTag: "role",
            masterRoles: ["master"],
            infraRoles: ["infra"],
            appRoles: ["compute"],
            nonSchedulableNodeRoles: [],
            nonScallableNodeRoles: ["etcd", "glusterfs", "master", "infra"],
            scaleUpTimeout: 3600,
            gracePeriodDrainingNode: 30,
            eventsCacheMaxSize: 50,
            eventsDatabaseExpiration: 2592000,
            // All time values are expressed in seconds
            backgroundProcessesIntervals: {
                checkNodes: 30,
                updatePrices: 3600,
                updatePerformance: 60,
                ocpConnectionMonitor: 60,
                awsConnectionMonitor: 60,
                maintenanceDataService: 3600
            },
            inventoryTags: {
                currentMastersNodes: "##CURRENT_MASTERS##",
                currentInfraNodes: "##CURRENT_INFRA##",
                currentAppNodes: "##CURRENT_NODES##",
                newMastersNodes: "##NEW_MASTERS##",
                newInfraNodes: "##NEW_INFRA##",
                newAppNodes: "##NEW_NODES##"
            },
            commonNodeLabels: {
                "logging-infra-fluentd": "true"
            },
            projectName: "ocb"
        },
        clouds: [{
                type: "aws",
                clusterNameTag: "ocb-openshift-clusterid",
                clusterRoleTag: "ocb-openshift-role",
                scaleUpTag: "ocb-scaleup-strategy",
                scaleDownTag: "ocb-scaledown-strategy",
                regions: [{
                        id: "us-east-2",
                        name: "Ohio",
                        pricingUsageTypePrefix: "USE2"
                    }]
            }],
        decisionManagerConfig: {
            isActive: true,
            url: "http://ocb-rules-engine-ra-temp.dev2.crossvale-ocp.com/cloudbalancer" ,
            username: "admin",
            password: "XV.1234!"
        },
        license: "rbq1fffa0533b0ddc3a4f617cf0dd9af0036c6aa9642813a305b1d6335ff4e17e3fa642089f97abf099ada30a22ed3eebbetul8harhphkql"
    }
};
exports.default = Object.assign(config);
//# sourceMappingURL=config.js.map