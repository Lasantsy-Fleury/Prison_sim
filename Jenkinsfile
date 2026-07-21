pipeline {
    agent any

    environment {
        // Configuration SonarQube
        SONAR_HOST_URL = 'http://192.168.19.50:9000'
        SONAR_TOKEN = credentials('sonar-token')
        
        // Configuration Docker
        DOCKER_REGISTRY = 'localhost:5000'  // À adapter si tu as un registry
        IMAGE_TAG = "${env.BUILD_ID}"
        
        // Configuration K3s
        K3S_SERVER = '192.168.19.51'
        K3S_TOKEN = credentials('k3s-token')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Lasantsy-Fleury/Prison_sim.git'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                    TIMESTAMP=$(date +%s)
                    sonar-scanner \
                        -Dsonar.projectKey=mon-projet-${TIMESTAMP} \
                        -Dsonar.projectName="Mon Projet ${TIMESTAMP}" \
                        -Dsonar.sources=. \
                        -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/** \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.login=${SONAR_TOKEN}
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        def qg = waitForQualityGate()
                        if (qg.status != 'OK') {
                            error " Quality Gate failed: ${qg.status}"
                        }
                    }
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                echo ' Construction de l\'image backend...'
                script {
                    dir('backend') {
                        docker.build("backend:${env.BUILD_ID}")
                    }
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo ' Construction de l\'image frontend...'
                script {
                    dir('frontend') {
                        docker.build("frontend:${env.BUILD_ID}")
                    }
                }
            }
        }

        stage('Deploy to K3s') {
            steps {
                script {
                    // Sauvegarder les images pour K3s
                    sh '''
                    docker save backend:${IMAGE_TAG} -o backend.tar
                    docker save frontend:${IMAGE_TAG} -o frontend.tar
                    
                    # Copier vers k3s-node
                    scp backend.tar frontend.tar cicd-server@${K3S_SERVER}:~/
                    ssh cicd-server@${K3S_SERVER} \
                        "docker load -i ~/backend.tar && \
                         docker load -i ~/frontend.tar && \
                         kubectl apply -f -"
                    '''
                }
            }
        }
    }
}