# How to install/update latest OCB version

## Collect all variables together

```
# IMPORTANT: Do not include the prefix in the URL
ocp_url: dev2.crossvale-ocp.com:443 
ocp_username: 'zzzzzzz'
ocp_token: 'ccccccc'

aws_access_key_id: 'XXXXXXXXXX'
aws_secret_access_key: 'YYYYYYYYYYYYYY'

ocb_project_name: ocb
ocb_project_display_name: "OCB :: Crossavle CloudBalancer"
ocb_service_account: ocb-system

registry_url: 'dri.crossvale-ocp.com:443/ocb/'
registry_username: 'xxxxxx'
registry_password: 'yyyyyy'
registry_auth: 'xxxxxx:yyyyyy'
registry_backend_relative_path: 'ocb/ocb-backend'
registry_ui_relative_path: 'ocb/ocb-ui'
registry_proxy_relative_path: 'ocb/ocb-proxy'

ocb_version: v0.124

ocb_backend_inventory_file_path: './inventory'
ocb_backend_config_file_path: './config.js'
ocb_backend_sshconfig_file_path: './ssh_config'
ocb_backend_fleet_templates_folder_path: './fleet_templates/'

ocb_proxy_cookie_secret: 'ashdfjhasdlkjfhalksdjhflak'
ocb_proxy_client_secret: 'abcdefghijklmnopqrstuvwxyz'

source_registry_url: 'dri.crossvale-ocp.com:443/ocb/'
source_registry_username: 'xxxxxx'
source_registry_password: 'yyyyyy'
source_registry_auth: 'xxxxxx:yyyyyy'
source_registry_backend_relative_path: 'ocb/ocb-backend'
source_registry_ui_relative_path: 'ocb/ocb-ui'
source_registry_proxy_relative_path: 'ocb/ocb-proxy'
```

## Pre-requisites

There has to exist a local 'oc' binary in the path that it's connected to the server where OCB has to be deployed in. 

Ansible will use the oc binary to start a session against the target OCP installation with the provided url, username and token provided and will include, for all the commands run, the target server and namespace explicitely in every command.

```
oc apply -f filename.yml -n {{ocb_project_name}} --server={{ocp_url}}
```

Ansible will also use 'Skopeo' for disconnected environments to pull images from the source docker registry to the docker registry where OCP will pull the images from.

**NOTE:** In order for this deployment process to work, the user running the OCP commands needs 'cluster-admin' permissions in the target OCP environment.

All the templates executed during the deployment process will use the action 'apply' so if the objects already exist they will be updated if there are changes and, if not, they will be created.

**NOTE 2:** The parameter 'OCB_DOCKER_REGISTRY_AUTH' for the project request template is the base64 encoded string of the 'username:password' for the docker registry. Please note the colon ';' symbol to separate them.

**NOTE 3:** The docker images might be proxied through a secure Docker Registry other than the Crossvale's Official one. In this case, all variables with the name starting by 'registry_' will be configured according to the docker registry where OCP will pull the images from and, in the last section, we will add a way to provide those images.

## Process the CRD schema definitions to store all OCB's internal objects
```
oc apply -f crd-schema-definition.yaml --server={{ocp_url}}
oc apply -f crd-events-definition.yaml --server={{ocp_url}}
```

## Create the project
Processing the following template will create the following objects with the target OCP environment:
* Project where OCB will be deployed
* A secret with credentials to connect to Crossvale's Official Docker Registry
* A specific service account to be used by OCB with 'cluster-admin' rights and linked to the docker secret previously created to be able to pull images automatically.
  
```
oc process -f ocb-project-template.yaml \
  -p OCB_PROJECT_NAME={{ocb_project_name}} \
  -p OCB_PROJECT_DISPLAY_NAME={{ocb_project_display_name}} \
  -p OCB_SERVICE_ACCOUNT={{ocb_service_account}} \
  -p OCB_DOCKER_REGISTRY_URL={{registry_url}} \
  -p OCB_DOCKER_REGISTRY_USERNAME={{registry_username}} \
  -p OCB_DOCKER_REGISTRY_PASSWORD={{registry_password}} \
  -p OCB_DOCKER_REGISTRY_AUTH={{registry_auth}} |oc apply -n {{ocb_project_name}} --server={{ocp_url}} -f -
```

## Deploy the backend
Since the escalation process is currently done with using the bootstrap image, there is no need to configure valid files for 'inventory' and 'ssh_config' so they can just remain as they are in this example or even empty files.

Edit the file 'config.js', specfially the following configuration keys to make sure they match your environment:
* **ocb.clusterId**: This is the value that identifies this cluster and will be used in combination with 'clusterNameTag' to filter the instances that belong to this cluster from any configured cloud provider.
* **ocb.clientId**: Client identifier that Crossvale will provide for every deployemnt.
* **ocb.ocp.defaultTimeZone**: The time zone that will be used to calculate times to local for the business rules. It has to be a valid database name from the [IANA](https://www.iana.org/time-zones) definition.
* **ocb.ocp.sessionToken**: if the service account running the deployment configuration for the backend has 'cluster-admin' permissions, this token can remain empty. Otherwise, token that identifies an account (user or service account) with 'clulster-admin' permissions.
* **ocb.ocp.url**: When deploying OCB within the target OCP environment it should remain with the default value (https://kubernetes.default.svc) so only internal communciation is used to gather information from the cluster.
* **ocb.ocp.roleTag**: if the cluster uses the new and default kubernetes notation for the nodes, this value can remain with its default value. Otherwise indicates which label in the node determine its role.
* **ocb.ocp.masterRoles**: list of all the roles within the cluster that identifies a master node within the target OCP environment.
* **ocb.ocp.infraRoles**: list of all the roles within the cluster that identifies an infrastructure node within the target OCP environment.
* **ocb.ocp.appRoles**: list of all the roles within the cluster that identifies worker or application nodes within the target OCP environment.
* **ocb.ocp.projectName**: Identifies the project where OCB is/will be deployed. It has to match the variable {{ocb_project_name}}
* **ocb.license**: License code provided by Crossvale for each OCB deployment.
* **ocb.clouds**: list of all the cloud providers that provides nodes to the target OCP environment. At this point of time only AWS is supported.
  * **type**: the only supported value is 'aws'.
  * **clusterNameTag**: represents the tag name that will be used when filtering instances from the cloud provider to identify nodes that belong to the target OCP environment.
  * **clusterRoleTag**: represents the tag name that will be used when filtering instances from the cloud provider to identify which is the role of the node within the target OCP environment.
  * **scaleUpTag**: identifies what is the scale up strategy to include that node within the taget OCP environment. When using the bootstrap image, the tag will point to configured value of 'none'. For clarification: the scaleUpTag will have the value 'ocb-scaleup-strategy' and, within the cloud provider, the value of the tag 'ocb-scaleup-strategy' will be 'none'.
  * **regions**: list of the different regions to monitor within the cloud provider with the following format:
    * **id**: identifier for the region.
    * **name**: friendly name of the region to be shown in the UI.
    * **pricingUsageTypePrefix**: preffix given by the pricing API to identify prices specifically from this region for this cloud provider.
* **ocb.decisionManagerConfig**: if active, configuration that OCB will use to trigger the business rules periodically asking for changes on the size of the target OCP environment.
  * **isActive**: indicates 'true' if the integration with the Decision Manager is active, otherwise it will be set up to 'false'
  * **url**: indicates the full URL to set the POST request to the Decision's Manager API.
  * **username**: indicates the username with permissions to execute the REST API call if the integration with the Decision Manager requires authentication, otherwise it will be empty.
  * **password**: indicates the password for the user with permissions to execute the REST API call if the integration with the Decision Manager requires authentication, otherwise it will be empty.
  
```
oc create configmap ocb-config --from-file=inventory={{ocb_backend_inventory_file_path}} --from-file=config.js={{ocb_backend_config_file_path}} --from-file=ssh_config={{ocb_backend_sshconfig_file_path}} -n {{ocb_project_name}} --server={{ocp_url}}
```

The folder containing the JSON templates to create the Spot Fleets in AWS has the following structure:
* A JSON file per each different fleet configuration. The content of the file is the JSON configuration provided by the cloud provided with no changes. The different configurations might represent:
  * Different OCP roles.
  * Different instance types from the cloud provider.
  * Different regions or availability zones from the cloud provider.
  * A combination of any of the above criterias.
* **ocbFleets.json**: this file contains an index on the different fleet configurations available for the target OCP environment with the following structure:
  * **id**: represents the unique identifier for this fleet configuration.
  * **name**: friendly name of this configuration to be shown in the OCB's UI.
  * **cloudType**: the only supported value at the moment is 'aws'.
  * **region**: the region within the cloud provider where this configurations will place the instances in.
  * **file**: name of the JSON file containing the definition of this configuration.

```
oc create configmap ocb-fleet-templates --from-file={{ocb_backend_fleet_templates_folder_path}} -n {{ocb_project_name}} --server={{ocp_url}}
```

Processing the following template will create the following objects with the target OCP environment:
* A secret with credentials to connect to AWS. There is a limitation in the current OCP versions that prevents this to properly work so it's not used. It will be linked in future verions when the bug is fixed.
* A specific service account to be used by OCB with 'cluster-admin' rights and linked to the docker secret previously created to be able to pull images automatically. 
* The image stream for the backend docker image.
* A deployment configuration to deploy the backend.
* A service to expose the pods deployed by the backend's deployment configuration.

```
oc process -f ocb-backend-template.yaml \
    -p OCB_PROJECT_NAME={{ocb_project_name}} \
    -p OCB_AWS_ACCESS_KEY_ID={{aws_access_key_id}} \
    -p OCB_AWS_SECRET_ACCESS_KEY={{aws_secret_access_key}} \
    -p OCB_VERSION={{ocb_version}} \
    -p OCB_DOCKER_REGISTRY_URL={{registry_url}} \
    -p OCB_BACKEND_RELATIVE_IMAGE_PATH={{registry_backend_relative_path}} \
    -p OAUTH_PROXY_COOKIE_SECRET={{ocb_proxy_cookie_secret}} \
    -p OCB_SERVICE_ACCOUNT={{ocb_service_account}} \
  |oc apply -n {{ocb_project_name}} --server={{ocp_url}} -f -
```

## Deploy the ui
Processing the following template will create the following objects with the target OCP environment:
* The image stream for the ui docker image.
* A deployment configuration to deploy the ui.
* A service to expose the pods deployed by the UI's deployment configuration.
  
```
    oc process -f ocb-ui-template.yaml \
    -p OCB_PROJECT_NAME={{ocb_project_name}} \
    -p OCB_VERSION={{ocb_version}} \
    -p OCB_DOCKER_REGISTRY_URL={{registry_url}} \
    -p OCB_UI_RELATIVE_IMAGE_PATH={{registry_ui_relative_path}} \
    -p OCB_SERVICE_ACCOUNT={{ocb_service_account}} |oc apply -n {{ocb_project_name}} --server={{ocp_url}} -f -
```

## Deploy the proxy
Processing the following template will create the following objects with the target OCP environment:
* An OAuth client so ocb-proxy can integrate with OCP's auth provider.
* The image stream for the ui docker image.
* A deployment configuration to deploy the ui.
* A service to expose the pods deployed by the UI's deployment configuration.
* A public route to expose the proxy upstream projects for the UI and the backend services.
  
```
    oc process -f ocb-proxy-template.yaml \
    -p OCB_PROJECT_NAME={{ocb_project_name}} \
    -p OAUTH_PROXY_VERSION={{ocb_version}} \
    -p REDHAT_DOCKER_REGISTRY_URL={{registry_url}} \
    -p REDHAT_PROXY_RELATIVE_IMAGE_PATH={{registry_proxy_relative_path}} \
    -p OAUTH_PROXY_CLIENT_SECRET={{ocb_proxy_client_secret}} \
    -p OAUTH_PROXY_COOKIE_SECRET={{ocb_proxy_cookie_secret}} \
    -p OCB_PUBLIC_HOSTNAME={{ocp_url}} \
    -p OCB_SERVICE_ACCOUNT={{ocb_service_account}} |oc apply -n {{ocb_project_name}} --server={{ocp_url}} -f -
```

## Deploying OCB images for disconnected environments
It might be the case that the client does not allow connectivity to an external docker registry from within the target OCP environment. 

In this case, a new playbook should be provided so the images can be pulled from the source and pushed to the final docker registry using Skopeo.

All variables starting with 'source_registry_' identify the source docker registry where the images have to be pulled from and all variables starting with 'registry_' idenfiy the destination docker registry where all the images will be pushed.

When pushing images to the target OCP environment's internal docker registry, it is recommended that in order to run the playbook to pull the images, the public route of the docker registry is used and, when running the deployment playbook, it is changed for the internal one so there is no external traffic involved when deploying a new version of the docker images.