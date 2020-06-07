package acl

import (
	"fmt"
	"os"

	"github.com/asdine/storm"
	"github.com/robrotheram/eckmanager/conf"
	"github.com/sirupsen/logrus"
	"k8s.io/client-go/dynamic"
)

var logger *logrus.Logger

type Datastore struct {
	DB *storm.DB
}

func NewDB(config *conf.DatabaseConfig, log *logrus.Logger) (*Datastore, error) {
	logger = log
	path := config.URI
	if path == "" {
		path = "."
	}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		os.Mkdir(path, os.ModePerm)
	}
	db, err := storm.Open(path + "/eckmanager.db")
	if err != nil {
		return nil, fmt.Errorf("Error Opening DB: %v", err)
	}
	return &Datastore{DB: db}, nil
}

func (d *Datastore) Close() {
	d.DB.Close()
}

func (d *Datastore) GetAllProjects(kubeClient dynamic.Interface) ([]Project, error) {
	var projects []Project
	err := d.DB.All(&projects)
	if err != nil {
		return []Project{}, err
	}
	for i, p := range projects {
		err := p.DoesExistInKube(kubeClient)
		if err == nil {
			projects[i] = p
		}

	}
	return projects, err
}
