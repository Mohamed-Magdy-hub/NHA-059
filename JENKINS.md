# Jenkins CI/CD Pipeline Setup

This directory contains the Jenkins pipeline configuration and supporting documentation for the URL Shortener application.

## Prerequisites

### Jenkins Configuration

1. **Install Required Jenkins Plugins:**

   - Docker Pipeline
   - Kubernetes CLI Plugin
   - Pipeline
   - Git Plugin
   - Credentials Binding Plugin

2. **Configure Jenkins Credentials:**

   Add the following credentials in Jenkins (Manage Jenkins → Credentials):

   - **DockerHub Credentials** (ID: `dockerhub-credentials`)
     - Type: Username with password
     - Username: Your DockerHub username
     - Password: Your DockerHub access token
     - ID: `dockerhub-credentials`

3. **Configure Jenkins Agent:**

   Ensure your Jenkins agent has the following installed:

   - Docker (with permissions to build/push images)
   - kubectl (configured with kubeconfig)
   - Node.js 20+ and npm
   - Git

### Kubernetes Configuration

1. **Configure kubectl on Jenkins Agent:**

   ```bash
   # Copy kubeconfig to Jenkins agent
   mkdir -p ~/.kube
   cp /path/to/kubeconfig ~/.kube/config

   # Test connection
   kubectl cluster-info
   ```

2. **Create namespace:**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

## Pipeline Setup

### 1. Create Jenkins Pipeline Job

1. In Jenkins, click **New Item**
2. Enter job name: `url-shortener-pipeline`
3. Select **Pipeline** and click OK
4. Configure the pipeline:

   **General:**

   - ☑ GitHub project
   - Project URL: `https://github.com/your-username/url-shortener`

   **Build Triggers:**

   - ☑ GitHub hook trigger for GITScm polling

   **Pipeline:**

   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/your-username/url-shortener.git`
   - Branch: `*/main` (or your default branch)
   - Script Path: `Jenkinsfile`

5. Save the configuration

### 2. Configure GitHub Webhook

1. Go to your GitHub repository → Settings → Webhooks
2. Click **Add webhook**
3. Configure:
   - Payload URL: `http://your-jenkins-url/github-webhook/`
   - Content type: `application/json`
   - Events: **Just the push event**
   - ☑ Active
4. Click **Add webhook**

### 3. Update Pipeline Variables

Edit the `Jenkinsfile` and update these variables:

```groovy
environment {
    DOCKER_REPO = 'your-dockerhub-username/url-shortener'  // ← Change this
    K8S_NAMESPACE = 'app'
    K8S_DEPLOYMENT_NAME = 'url-shortener'
}
```

### 4. Update Kubernetes Manifests

Edit `k8s/deployment.yaml` and update:

```yaml
image: your-dockerhub-username/url-shortener:latest # ← Change this
```

Edit `k8s/configmap.yaml` and update:

```yaml
data:
  base_url: "https://your-domain.com" # ← Change this
```

Edit `k8s/ingress.yaml` (optional) and update:

```yaml
spec:
  rules:
    - host: shortener.example.com # ← Change this
```

## Pipeline Workflow

The pipeline executes the following stages:

1. **Checkout** - Pulls latest code from GitHub
2. **Install & Test** - Runs `npm ci` and executes tests (if available)
3. **Build Docker Image** - Builds image with build number tag
4. **Push to DockerHub** - Pushes image to DockerHub registry
5. **Deploy to Kubernetes** - Applies K8s manifests and updates deployment
6. **Healthcheck** - Verifies deployment is healthy and running

### Pipeline Features

- ✅ Declarative syntax
- ✅ Multi-stage Docker build
- ✅ Automatic versioning (build number)
- ✅ Idempotent deployments
- ✅ Rolling updates with zero downtime
- ✅ Health checks and readiness probes
- ✅ Automatic rollout verification
- ✅ Post-build notifications
- ✅ Workspace cleanup

## Manual Pipeline Execution

To run the pipeline manually:

1. Go to Jenkins → `url-shortener-pipeline`
2. Click **Build Now**
3. Monitor the build in **Console Output**

## Kubernetes Deployment

### Deploy Manually (without Jenkins)

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get all -n app

# Check pod logs
kubectl logs -f deployment/url-shortener -n app

# Get service endpoint
kubectl get svc url-shortener -n app
```

### Access the Application

```bash
# Port-forward for local access
kubectl port-forward svc/url-shortener 3000:80 -n app

# Access at http://localhost:3000
```

### Scale the Deployment

```bash
kubectl scale deployment url-shortener --replicas=3 -n app
```

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/url-shortener -n app

# Rollback to previous version
kubectl rollout undo deployment/url-shortener -n app

# Rollback to specific revision
kubectl rollout undo deployment/url-shortener --to-revision=2 -n app
```

## Monitoring

### Check Pipeline Status

```bash
# Get all deployments
kubectl get deployments -n app

# Get pods
kubectl get pods -n app -l app=url-shortener

# Check pod logs
kubectl logs -f <pod-name> -n app

# Describe pod for issues
kubectl describe pod <pod-name> -n app
```

### Check Application Health

```bash
# Test endpoint (requires port-forward or ingress)
curl http://localhost:3000/api/urls
```

## Troubleshooting

### Pipeline Fails at Docker Build

- Verify Docker is installed and running on Jenkins agent
- Check Jenkins user has permission to run Docker commands
- Verify Dockerfile syntax

### Pipeline Fails at DockerHub Push

- Verify DockerHub credentials are correct in Jenkins
- Check credential ID matches `dockerhub-credentials`
- Ensure DockerHub repository exists and you have push access

### Pipeline Fails at Kubernetes Deploy

- Verify kubectl is configured on Jenkins agent
- Check kubeconfig has correct cluster context
- Verify namespace exists: `kubectl get namespace app`
- Check RBAC permissions for service account

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n app

# Check pod logs
kubectl logs <pod-name> -n app

# Common issues:
# - Image pull errors (check image name and registry)
# - Resource limits (check node resources)
# - PVC not bound (check storage class)
```

## Security Best Practices

✅ **Implemented:**

- Non-root user in Docker container (UID 1001)
- Resource limits and requests
- Security context in Kubernetes
- Liveness and readiness probes
- Credentials stored securely in Jenkins
- Private container registry authentication

⚠️ **Additional Recommendations:**

- Enable network policies for pod-to-pod communication
- Use secrets for sensitive data (not ConfigMaps)
- Enable Pod Security Policies/Standards
- Implement RBAC for fine-grained access control
- Use TLS/HTTPS for ingress (configure cert-manager)
- Regular security scanning of container images

## CI/CD Best Practices Implemented

- ✅ Declarative pipeline syntax
- ✅ Multi-stage Docker builds
- ✅ Semantic versioning with build numbers
- ✅ Automated testing (when tests exist)
- ✅ Rolling updates with zero downtime
- ✅ Health checks and readiness probes
- ✅ Automatic rollout verification
- ✅ Idempotent deployments
- ✅ Workspace cleanup
- ✅ Build artifacts retention policy
- ✅ Notification on success/failure

## Support

For issues or questions:

1. Check Jenkins console output for detailed error messages
2. Review Kubernetes pod logs
3. Verify all prerequisites are met
4. Check GitHub webhook delivery status
