package audit

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/context"
	"github.com/robrotheram/eckmanager/acl"
)

var AuditChan = make(chan AuduitEvent, 100)
var AuditWriters = []AuditWriter{}

func AddWriter(a AuditWriter) {
	AuditWriters = append(AuditWriters, a)
}

func Audit(user, action, message string) {
	a := AuduitEvent{Time: time.Now(), User: user, Action: action, Message: message}
	AuditChan <- a
}

func AuditWithRequest(r *http.Request, action, object, message string) {
	userIterface := context.Get(r, "user")
	if userIterface == nil {
		return
	}
	user := userIterface.(*acl.User)

	a := AuduitEvent{Time: time.Now(), User: user.Username, Action: action, Object: object, Message: message}
	AuditChan <- a
}

type AuduitEvent struct {
	Time    time.Time
	User    string
	Action  string
	Object  string
	Message string
}

func (ae AuduitEvent) String() string {
	return fmt.Sprintf("%s, %s %s %s", ae.Time, ae.User, ae.Action, ae.Message)
}

type AuditWriter interface {
	Setup() error
	Close()
	Write(AuduitEvent)
}

func AuditProcessor() {
	for audit := range AuditChan {
		for _, writer := range AuditWriters {
			writer.Write(audit)
		}
	}
}
