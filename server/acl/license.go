package acl

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type Licence struct {
	Id      string `storm:"id"`
	Trial   bool
	Licence string
}

func (l *Licence) generateEnterpriseLicense() *unstructured.Unstructured {
	return &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "v1",
			"kind":       "Secret",
			"metadata": map[string]interface{}{
				"labels": map[string]interface{}{
					"license.k8s.elastic.co/scope": "operator",
				},
				"name":      "eck-license",
				"namespace": "elastic-system",
			},
			"type": "Opaque",
			"data": map[string]interface{}{
				"license": l.Licence,
			},
		},
	}

}
func (l *Licence) generateTrialLicense() *unstructured.Unstructured {
	return &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "v1",
			"kind":       "Secret",
			"metadata": map[string]interface{}{
				"labels": map[string]interface{}{
					"license.k8s.elastic.co/type": "enterprise_trial",
				},
				"name":      "eck-trial-license",
				"namespace": "elastic-system",
				"annotations": map[string]interface{}{
					"elastic.co/eula": "accepted",
				},
			},
		},
	}

}

func (l *Licence) GenerateLicense(kubeClient dynamic.Interface) error {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "secrets"}
	var deployment *unstructured.Unstructured
	if l.Trial {
		deployment = l.generateTrialLicense()
	} else {
		deployment = l.generateEnterpriseLicense()
	}

	logger.Infof("Creating Elastic License")
	_, err := kubeClient.Resource(deploymentRes).Namespace("elastic-system").Create(deployment, metav1.CreateOptions{})
	if err != nil {
		_, err = kubeClient.Resource(deploymentRes).Namespace("elastic-system").Update(deployment, metav1.UpdateOptions{})
	}
	return err
}

func (l *Licence) GetLicense(kubeClient dynamic.Interface) (map[string]string, error) {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}
	result, err := kubeClient.Resource(deploymentRes).Namespace("elastic-system").List(metav1.ListOptions{})

	for _, item := range result.Items {
		data, found, err := unstructured.NestedStringMap(item.Object, "data")
		if err != nil || !found {
			continue
		}
		if len(data["eck_license_level"]) > 0 {
			return data, nil
		}

	}

	return map[string]string{}, err
}
