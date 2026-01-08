pipeline {
    agent any

    environment {
        DOCKER_HUB_CREDENTIALS = 'docker-hub-credentials' // Jenkins credential ID
        DOCKER_HUB_ORG = 'your_dockerhub_org' // Replace with your Docker Hub organization
        BACKEND_IMAGE = "${DOCKER_HUB_ORG}/car-management-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_ORG}/car-rental-frontend"
        IMAGE_TAG = "${env.BUILD_ID}"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/KnaniOussama/Project-DEVOPS.git' // Replace with your repository URL
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    dir('car-management-backend') {
                        sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} ."
                    }
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    dir('car-rental-frontend') {
                        sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} ."
                    }
                }
            }
        }

        stage('Security Scan Backend') {
            steps {
                script {
                    sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:0.48.3 image --exit-code 1 --severity CRITICAL ${BACKEND_IMAGE}:${IMAGE_TAG}"
                }
            }
        }

        stage('Security Scan Frontend') {
            steps {
                script {
                    sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:0.48.3 image --exit-code 1 --severity CRITICAL ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                }
            }
        }

        stage('Push Backend Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_HUB_CREDENTIALS, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh "echo \"$DOCKER_PASSWORD\" | docker login -u \"$DOCKER_USERNAME\" --password-stdin"
                        sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Push Frontend Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_HUB_CREDENTIALS, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh "echo \"$DOCKER_PASSWORD\" | docker login -u \"$DOCKER_USERNAME\" --password-stdin"
                        sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker images...'
            sh "docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG} || true"
            sh "docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} || true"
        }
        failure {
            echo 'Pipeline failed. Review the logs.'
        }
        success {
            echo 'Pipeline succeeded!'
        }
    }
}
