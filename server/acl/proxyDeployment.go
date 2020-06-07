package acl

import (
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

func (config *Deployment) proxyDeploymentConfig() *unstructured.Unstructured {
	deployment := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "networking.k8s.io/v1beta1",
			"kind":       "Ingress",
			"metadata": map[string]interface{}{
				"name": fmt.Sprintf("%s-ingress", config.Name),
				"annotations": map[string]interface{}{
					"kubernetes.io/ingress.class":                  "nginx",
					"nginx.ingress.kubernetes.io/backend-protocol": "HTTPS",
					"nginx.ingress.kubernetes.io/ssl-redirect":     "true",
					"nginx.ingress.kubernetes.io/ssl-passthrough":  "true",
				},
			},
			"spec": map[string]interface{}{
				"rules": []map[string]interface{}{
					{
						"host": config.GetElasitcURL(),
						"http": map[string]interface{}{
							"paths": []map[string]interface{}{
								{
									"path": "/",
									"backend": map[string]interface{}{
										"serviceName": config.Name + "-es-http",
										"servicePort": 9200,
									},
								},
							},
						},
					},
					{
						"host": config.GetKibanaURL(),
						"http": map[string]interface{}{
							"paths": []map[string]interface{}{
								{
									"path": "/",
									"backend": map[string]interface{}{
										"serviceName": config.Name + "-kb-http",
										"servicePort": 5601,
									},
								},
							},
						},
					},
				},
			},
		},
	}
	return deployment
}

func (config *Deployment) ProxyDeploy(kubeClient dynamic.Interface, namespace string) error {

	deploymentRes := schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1beta1", Resource: "ingresses"}
	deployment := config.proxyDeploymentConfig()

	result, err := kubeClient.Resource(deploymentRes).Namespace(namespace).Create(deployment, metav1.CreateOptions{})
	if err != nil {
		err = kubeClient.Resource(deploymentRes).Namespace(namespace).Delete(fmt.Sprintf("%s-ingress", config.Name), &metav1.DeleteOptions{})

		result, err = kubeClient.Resource(deploymentRes).Namespace(namespace).Create(deployment, metav1.CreateOptions{})

		logger.Warnf("Unable to deploy proxy error : %v", err)
		return err

	}
	logger.Infof("Created deployment %q.\n", result.GetName())
	return nil
}

func (config *Deployment) ProxyDelete(kubeClient dynamic.Interface, namespace string) error {
	deploymentRes := schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1beta1", Resource: "ingresses"}
	err := kubeClient.Resource(deploymentRes).Namespace(namespace).Delete(config.Name, &metav1.DeleteOptions{})
	return err
}
