###
# This file configures the project "Piper" pipeline of your project.
# For a reference of the configuration concept and available options, please have a look into its documentation.
#
# The documentation for the most recent pipeline version can always be found at:
#    https://sap.github.io/jenkins-library/
#
# This is a YAML-file. YAML is an indentation-sensitive file format. Please make sure to properly indent changes to it.
###

### General project setup
general:
  productiveBranch: 'main'
  inferBuildTool: true
  projectName: '{{ projectName }}'

### Step-specific configuration
steps:
  artifactPrepareVersion:
    versioningType: cloud_noTag

  pipelineStashFilesAfterBuild:
    stashIncludes:
      deploymentFolder: 'deployment/**'

  cloudFoundryDeploy:
    stashContent:
      - 'deployDescriptor'
      - 'pipelineConfigAndTests'
      - 'deploymentFolder'

  buildExecute:
    npmRunScripts:
      - ci-build
      - ci-package

### Stage-specific configuration
stages:
  Integration:
    install: true
    runScripts:
      - ci-it-backend

  'Confirm':
    manualConfirmation: false

#  Release:
#    cfTargets:
#      - org: 'myOrg'
#        space: 'mySpace'
#        apiEndpoint: 'https://'
#        appName: '{{ projectName }}'
#        manifest: 'manifest.yml'
#        credentialsId: 'myDeploymentCredentialsId'
