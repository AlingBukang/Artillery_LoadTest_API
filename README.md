# GateGuardian-LoadTest

artillery -o report.json --environment=livestage run index.yml

artillery -o report.json run script.yml

#To execute serverless artillery

slsart invoke --stage uat --profile alex.mejia-DeveloperOregon --region us-west-2