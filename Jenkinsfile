pipeline {
    agent { label 'agent-svc-us-west-2' }

    parameters {
        choice choices: ['GET ACCESS TOKENS', 'RUN LOAD TEST', 'STOP LOAD TEST'],
        description: 'Select stages to run.',
        name: 'TRIGGER_ACTIONS'
    }

    stages {
        stage('Get Access Tokens') {
            when {
                anyOf {
                    expression { getAcessTokens() }
                    not { expression { runLoadTest() }
                }
            }

            agent {
              docker { image 'node:10' }
            }

            steps {
                echo 'Prep lambda function handler....'
                sh 'npm install'
                sh 'node -v helper.js'
            }

            steps {
                echo 'Package lambda....'
                script {
                    stage = "${stage}"
                    region = "${region}"
                    sh "cd artillery"
					sh "npm install"
                    sh "serverless package --stage ${stage} --region ${region}"
                } 
            }

            steps {
                echo 'Deploy lambda....'
                script {
                    stage = "${stage}"
                    region = "${region}"
                    funcName = "${funcName}"
                    awsacct.&apiuat {
                        //sh "./artillery/serverless deploy function --function ${funcName} --stage ${stage} --region ${region}"
                        sh "aws lambda update-function-code --zip-file fileb://${zipFile} --function-name ${funcName}"
                        // Some deployment workflow involves saving the zip file to S3
                        //sh "aws s3 cp ${zipFile} s3://mybucket/${zipFile}"
                    }
                }
            }
        }

        stage('Invoke Lambda') {  //pre-req: always run getAccessTokens
            steps {
                echo 'Invoking lambda....'
                script {
                    stage = "${stage}"
                    region = "${region}"
                    awsacct.&apiuat {
                        sh "./artillery/slsart invoke --stage ${stage} --region ${region}"
                    }
                }
            }
        }

        stage('Stop Load Test') {
            when {
                anyOf {
                    expression { invokeLambda() }
                    not { expression { runAll() }
                }
            }

            steps {
                sh "slsart kill --stage ${stage} --region ${region}"
            }
        }
    }
}

//def zipFile = "serverless-artillery.zip"
def functionName = "serverless-artillery-uat-loadGenerator"
def stage = "uat"
def region = "us-west-2"

def runLoadTest() { getAcessTokens() && params.TRIGGER_ACTIONS == 'Invoke Lambda' }
def getAcessTokens() { params.TRIGGER_ACTIONS == 'Get Access Tokens' }
def stopLoadTest() { params.TRIGGER_ACTIONS == 'Stop Load Test' }

def dirExists(dirName) { sh(script: "[ -d '${dirName}' ]", returnStatus: true) == 0 }
def archiveDir(dirname, filename) {
    if (fileExists(filename)) { sh "sudo rm $filename" }
    if (dirExists(dirname)) {
        zip dir: dirname, zipFile: filename, glob: '', archive: true
    }
}