# DevOps Mini-Project Documentation

This document outlines the DevOps implementation for the Car Management application, covering containerization, CI/CD with Jenkins, Kubernetes deployment with Helm, and Monitoring/Observability with Prometheus and Grafana.

## 1. Prerequisites

To set up and run this project, you need to have the following software installed on your machine:

*   **Git**: For cloning the repository.
    *   [Download Git](https://git-scm.com/downloads)
*   **Node.js & npm**: Required for building the frontend (React) and backend (NestJS) applications.
    *   [Download Node.js](https://nodejs.org/)
*   **Docker Desktop**: Includes Docker Engine, Docker Compose, and a local Kubernetes cluster.
    *   [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
*   **kubectl**: Kubernetes command-line tool, typically included with Docker Desktop.
    *   Verify installation: `kubectl version --client`
*   **Helm**: Kubernetes package manager.
    *   [Install Helm](https://helm.sh/docs/intro/install/)
*   **Jenkins**: For Continuous Integration/Continuous Delivery.
    *   Installation instructions will be covered in the CI/CD section.
*   **Trivy (Optional, for local security scans)**: A comprehensive security scanner.
    *   [Install Trivy](https://aquasecurity.github.io/trivy/v0.48/getting-started/installation/)

## 2. Installation and Setup

### 2.1. Clone the Repository

```bash
git clone <your-repository-url>
cd Project-DEVOPS
```

### 2.2. Backend Application Setup (car-management-backend)

```bash
cd car-management-backend
npm install
cd ..
```

### 2.3. Frontend Application Setup (car-rental-frontend)

```bash
cd car-rental-frontend
npm install
cd ..
```

## 3. Containerization (Docker)

The application is containerized using Docker. Each service (backend and frontend) has its own `Dockerfile`.

### Dockerfiles

*   `car-management-backend/Dockerfile`: Builds the NestJS backend application.
*   `car-rental-frontend/Dockerfile`: Builds the React frontend application and serves it with Nginx.

## 4. Local Development with Docker Compose

The `docker-compose.yml` file allows you to run the entire application stack locally using Docker Compose.

### 4.1. Configuration

Ensure your backend environment variables are correctly set in the `docker-compose.yml` or a `.env` file for the backend.

### 4.2. Running the Application

From the root of the `Project-DEVOPS` directory, run:

```bash
docker compose up --build
```

This will:
*   Build the Docker images for the frontend and backend (if not already built or if changes detected).
*   Start the `car-management-backend` service (exposed on `http://localhost:3000`).

### 4.3. Verification

*   Access the backend API: `http://localhost:3000/api` (for Swagger UI, if enabled)

## 5. Continuous Integration with Jenkins

This project includes a `Jenkinsfile` for automating the CI pipeline.

### 5.1. Jenkins Setup

Follow the official Jenkins documentation to set up a Jenkins instance. Ensure Docker is accessible by Jenkins (e.g., by adding the `jenkins` user to the `docker` group or configuring Docker socket mounting).
docker run -u root -rm -d -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock --name jenkins jenkins/jenkins:lts
### 5.2. Configure Docker Hub Credentials

In Jenkins, create a "Secret text" credential with ID `docker-hub-credentials`. Store your Docker Hub username and password there.

### 5.3. Create a Jenkins Pipeline Job

1.  In Jenkins, create a new "Pipeline" item.
2.  Configure it to use your SCM (e.g., Git) and point to the `Jenkinsfile` in the root of your repository.
3.  Set the Docker Hub organization environment variable in the Jenkinsfile (`DOCKER_HUB_ORG`) to your actual Docker Hub organization.

### 5.4. Pipeline Stages

The `Jenkinsfile` defines the following stages:

1.  **Checkout**: Clones the source code from the Git repository.
2.  **Build Backend Image**: Builds the Docker image for the backend application.
3.  **Build Frontend Image**: Builds the Docker image for the frontend application.
4.  **Security Scan Backend**: Scans the backend image for vulnerabilities using Trivy. Fails on critical vulnerabilities.
5.  **Security Scan Frontend**: Scans the frontend image for vulnerabilities using Trivy. Fails on critical vulnerabilities.
6.  **Push Backend Image**: Pushes the backend image to Docker Hub.
7.  **Push Frontend Image**: Pushes the frontend image to Docker Hub.

## 6. Kubernetes Deployment (Docker Desktop & Helm)

The application can be deployed to a local Kubernetes cluster using Docker Desktop and managed with Helm.

### 6.1. Enable Kubernetes on Docker Desktop

Go to Docker Desktop settings, navigate to the "Kubernetes" tab, and enable the Kubernetes cluster.

### 6.2. Deploy Kubernetes Manifests (Optional - Helm is preferred)

Individual Kubernetes manifests are provided in the `kubernetes-manifests/` directory. These can be applied directly, but using Helm is the recommended approach.

```bash
kubectl apply -f kubernetes-manifests/
```

### 6.3. Deploy with Helm Charts

The application is packaged as a Helm chart for easier deployment and management.

#### 6.3.1. Install the Main Chart

From the root of the `Project-DEVOPS` directory, run:

```bash
helm install car-management ./car-management
```

This will deploy:
*   Backend Deployment and Service

#### 6.3.2. Verification

*   Check Kubernetes pods:
    ```bash
    kubectl get pods
    ```
*   Check Kubernetes services:
    ```bash
    kubectl get services
    ```
*   Access the frontend: `http://localhost:30080` (assuming Docker Desktop's Kubernetes is running locally)

## 7. Monitoring & Observability (Prometheus & Grafana)

Prometheus is used for collecting metrics for visualization.

### 7.1. Deploy Prometheus

Prometheus i deployed using the `kube-prometheus-stack` Helm chart. The `prometheus-grafana-values.yaml` file was used for custom configuration.

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack -f prometheus-grafana-values.yaml --version 51.0.0
```


### 7.3. Application Metrics

The backend application exposes Prometheus metrics at the `/metrics` endpoint (e.g., `backend-service:3000/metrics`). Prometheus is configured to scrape this endpoint.

### 7.4. Creating Dashboards

After logging into Grafana:

*   **Application Dashboard**: Create a new dashboard and add panels to visualize metrics from your backend application (e.g., request rates, error rates, custom business metrics).
*   **Cluster/Resource Dashboard**: Explore the pre-built dashboards provided by `kube-prometheus-stack` (e.g., Kubernetes / Compute Resources / Namespace (Pods), Kubernetes / Kubelet) or create custom ones to monitor cluster health, CPU/memory usage, etc.
