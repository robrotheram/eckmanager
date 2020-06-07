package containerMetrics

import (
	"fmt"
	"time"

	"github.com/robrotheram/eckmanager/acl"
	"gopkg.in/inf.v0"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	metrics "k8s.io/metrics/pkg/apis/metrics/v1beta1"
	"k8s.io/metrics/pkg/client/clientset/versioned"
)

type ContainerMetrics struct {
	Name   string
	CPU    *inf.Dec
	Memory *inf.Dec
	Disk   string
}

type PodMetrics struct {
	Name    string
	Metrics []ContainerMetrics
}

type NamespaceMetrics struct {
	Time    time.Time
	Metrics []PodMetrics
}

func GetPodMetric(podMetrics metrics.PodMetrics) PodMetrics {
	metric := PodMetrics{
		Name:    podMetrics.Name,
		Metrics: []ContainerMetrics{},
	}
	for _, container := range podMetrics.Containers {
		cpuQuantity := container.Usage.Cpu().AsDec()
		memQuantity := container.Usage.Memory().AsDec()
		metric.Metrics = append(metric.Metrics, ContainerMetrics{
			Name:   container.Name,
			CPU:    cpuQuantity,
			Memory: memQuantity,
		})
	}
	return metric
}

func (sw *SlidingWindow) getNamespaceMetrics() (NamespaceMetrics, error) {
	metric := NamespaceMetrics{Time: time.Now(), Metrics: []PodMetrics{}}
	podMetrics, err := sw.Clientset.MetricsV1beta1().PodMetricses(sw.NameSpace).List(metav1.ListOptions{})
	if err != nil {
		fmt.Println(err)
		return NamespaceMetrics{}, err
	}
	for _, podMetric := range podMetrics.Items {
		metric.Metrics = append(metric.Metrics, GetPodMetric(podMetric))
	}
	return metric, nil
}

func (n *NamespaceMetrics) PrintMetrics() {
	fmt.Printf("----------- %s ---------------\n", n.Time.Format("2006-01-02 15:04:05"))
	for _, pods := range n.Metrics {
		fmt.Printf("Pod: %s \n", pods.Name)
		for _, c := range pods.Metrics {
			fmt.Printf("\t Container: %s \n", c.Name)
			fmt.Printf("\t CPU: %d \n", c.CPU)
			fmt.Printf("\t MEMORY: %d \n", c.Memory)
		}

	}
}

var Metrics map[string]*SlidingWindow = make(map[string]*SlidingWindow)

func AddNamespaceMetrics(namespace acl.Project, client *versioned.Clientset) {
	sw := MustNew(15*time.Minute, 5*time.Second, client, namespace.Name)
	Metrics[namespace.Name] = sw
}

func GetNamespaceMetrics(namespace string) []NamespaceMetrics {
	metrics := []NamespaceMetrics{}
	for _, m := range Metrics[namespace].GetMetrics() {
		if len(m.Metrics) != 0 {
			metrics = append(metrics, m)
		}
	}
	return metrics
}

func GetPodMetrics(podname string, namespace string) []NamespaceMetrics {
	metrics := []NamespaceMetrics{}
	for _, m := range Metrics[namespace].GetMetrics() {
		if len(m.Metrics) != 0 {
			pm := []PodMetrics{}
			for _, j := range m.Metrics {
				if j.Name == podname {
					pm = append(pm, j)
				}
			}
			m.Metrics = pm
			metrics = append(metrics, m)
		}
	}
	return metrics
}
