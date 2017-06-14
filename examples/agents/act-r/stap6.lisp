;; act-r device for tcp-tasks running STAP6 api
;;  this code de-serializes STAP display updates to create standard text/button elements in ACT-R visicon, and serializes ACT-R button clicks into STAP button-click actions
;;
;; to run your model:
;;  after you define your model, use (run-tcp-task :host HOST :port PORT :real-time REALTIME_OR_NOT :pause-between-actions PAUSE_OR_NOT) to connect to task served on HOST/PORT, and run in REALTIME_OR_NOT
;;		the suggestion is to always set :pause-between-actions flag to T; however, it you need the model-time to keep going even when there are no buttons to press and no scheduled display changes, set this flag to NIL
;;



;;TODO:
;;	seems to be that with pause-between-actions t, the model has less clicks/time per trial, than same nil, but still more clicks/time per trial than real-time t (should do a proper test of this)
;;	check that socket is open before reading/writing
;;	make a nicer model, check that x/y/w/h of all elements is correct (can do right from model)
;;
;; pvt (nil t) 313 347 302 281 295 295 315.5
;; pvt (nil nil) 378 351 292.5 653 334.5 409.25
;; pvt (t nil) 320.25 380 377.25 335.5 379.25 293
;; pvt (t t) 318.25 379.75 334.5 375.75 303.25


;; pause-on: any display update wo buttons, any scheduled event, a button click
;; continue-on: display update has buttons, events cleared

;; readsocket-thread: 
;;	stap-update (q W/S events to be scheduled in main thread)
;;	q proc-display
;; main-thread:
;;	run-until-condition
;;		on periodic-event
;;			if q
;;				proc-display
;;				while no buttons/events, pause
;;		on input event
;;			:onedit
;;				proc-display
;;				while no buttons/events, pause
;;		on W/S event
;;			stap-update
;;				proc-display
;;				while no buttons/events, pause
;;


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; load modules
(eval-when (:compile-toplevel :load-toplevel :execute)
	(ql:quickload "usocket" :silent t)
	(ql:quickload "st-json" :silent t)
	(ql:quickload "bordeaux-threads" :silent t))
;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; define constants
(defconstant +implemented-options+ '("S" "W" "onedit"))
(defconstant +pixel-offset+ 10)
;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; global variables
(defvar *socket* nil)
(defvar *socket-read-thread* nil)
(defvar *hierarchical-display* (list nil))
(defvar *options* (make-hash-table :test 'eq))
(defvar *parents* (make-hash-table :test 'eq))
(defvar *level* (make-hash-table :test 'eq))
(defvar *running-in-real-time* t)
(defvar *pause-between-actions* t)
(defvar *updating* nil)
(defvar *msg-queue* nil)
(defvar *q-lock* (uni-make-lock "q-lock"))
;(defvar *event-lock* (uni-make-lock "event-lock"))
(defvar *stap-event-list* nil)
;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; debugging
;;
(defun print-hash (tbl &optional padding)
	(maphash #'(lambda (key val)
		(format t "~a~s : ~s~%" (or padding "") key val)) tbl))
(defun print-options ()
	(maphash #'(lambda (key val)
		(format t "~a:~%" key)
		(print-hash val "    ")) *options*))
;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; async socket client
;;
(defun socket-readlines (with-line-f &optional (socket *socket*))
	(setq *socket-read-thread*
		(bt:make-thread
			(lambda ()
				;(ignore-errors
					(let ((line))
						(loop while (setq line (read-line (usocket:socket-stream socket) nil)) do
							(model-output "<= ~a" line)
							(funcall with-line-f line)));)
				(model-output "Closing socket.")
				(usocket:socket-close socket)))))

(defun close-socket (&optional (socket *socket*))
	(usocket:socket-close socket))

(defun socket-sendjson (data &optional (socket *socket*))
	(model-output "=> ~a" (st-json:write-json-to-string data))
	(st-json:write-json data (usocket:socket-stream socket))
	(terpri (usocket:socket-stream socket))
	(finish-output (usocket:socket-stream socket)))

;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; STAP for ACT-R
;;

;; events
(defun past-time (time) (<= time (get-time)))
(defun remove-stap-events ()
	(uni-lock *q-lock*)
	(model-output "[~a] removing old from ~a" (get-time) *stap-event-list*)
	(setq *stap-event-list* (remove-if 'past-time *stap-event-list*))
	(model-output "events: ~a" *stap-event-list*)
	(uni-unlock *q-lock*)
	)
(defun stap-event (event-time fct)
	(uni-lock *q-lock*)
	(loop while (find (incf event-time) *stap-event-list*))
	(model-output "schedule-event ~a ~a"  (/ event-time 1000) fct)
	(schedule-event (/ event-time 1000) fct)
	(model-output "Push ~a ~a ..." event-time *stap-event-list*)
	(push event-time *stap-event-list*)
	(model-output "... Events: ~a" *stap-event-list*)
	(schedule-event (/ (1+ event-time) 1000) 'remove-stap-events)
	(uni-unlock *q-lock*)
	)
;;

(defun display-update (&optional (val 'done))
	(uni-lock *q-lock*)
	(setq *updating* val)
	(model-output "*updating* = ~a" *updating*)
	(uni-unlock *q-lock*))
	; (if (eq *pause-between-actions* 'paused)
		; (setq *need-to-proc* t)
		; (proc-and-print)))
	;(proc-and-print))
	;(stap-event (1+ (get-time)) 'proc-and-print))
	;(let ( (event-time (get-time)) )
	;	(loop while (find (incf event-time) *stap-event-list*))
		;(stap-event (schedule-event (/ event-time 1000) 'proc-and-print))
	;	))

(defun proc-and-print ()
	(let ((proc nil))
		(uni-lock *q-lock*)
		(when (eq *updating* 'done)
			(model-output "in proc-and-print ~a" *updating*)
			(setq proc t)
			(setq *updating* nil))
		(uni-unlock *q-lock*)
		(when proc
			(proc-display)
			(if *print-visicon* (print-visicon))
			(pause-for-something-to-do))))

; (defun proc-and-print ()
	; (proc-display)
	; (if *print-visicon* (print-visicon))
	; (pause-for-something-to-do)
	; )

(defun stop-condition ()
	(and (not (bt:thread-alive-p *socket-read-thread*)) (not *stap-event-list*) (not *updating*) (not *msg-queue*)))
(defun prep-device ()
	(when (not (current-device))
		(install-device (open-exp-window "task" :x 0 :y 0 :width 800 :height 1200 :visible t)))
	(add-word-characters #\_ #\- #\+ #\* #\# #\) #\( #\. #\, #\; #\! #\? #\space #\newline #\\ #\/ #\: #\* #\" #\')
	(clear-exp-window))
(defun prep-model ()
	(suppress-warnings
		(chunk-type (button (:include oval)))
		(define-chunks (button name oval))
		(merge-chunks button oval))
	(prep-device))
(defun run-tcp-task (&key (host "localhost") (port 9000) (timeout 30) (real-time t) (pause-between-actions t))
	(when (current-model)
		(prep-model)
		(setq *print-visicon* (no-output (car (sgp :v))))
		(setq *socket* (usocket:socket-connect host port :timeout timeout))
		(socket-sendjson '(0 (0))) ;; let task-sw know that user-sw is ready
		(socket-readlines #'stap-update)
		(schedule-periodic-event .05 'proc-and-print :maintenance t)
		(if (setq *pause-between-actions* pause-between-actions)
			(pause-for-something-to-do))
		(run-until-condition 'stop-condition :real-time (setq *running-in-real-time* real-time))))

;; model actions
(defun button-click (btn)
	(let ((oninput (get-option btn "onedit")))
		(when oninput
			;(model-output "oninput: ~s" oninput)
			(display-update 'in-progress)
			(process-element (gethash btn *parents*) (list btn oninput) (gethash btn *level*))
			(display-update)))
	(socket-sendjson (list (get-time) (DIALOG-ITEM-TEXT btn) t)))
;	(pause-for-something-to-do))

(defun pause-for-something-to-do ()
	(when *pause-between-actions*
		(let ((i 0))
			(model-output "*PAUSED...")
			(setq *pause-between-actions* 'paused)
			(loop while (and
				(not (find 'button-vdi (mapcar 'type-of (flatten *hierarchical-display*))))
				(not *stap-event-list*)
				(bt:thread-alive-p *socket-read-thread*)) do (incf i))
			(setq *pause-between-actions* t)
			(model-output "...CONTINUING [after ~a wait cycles] *" i))))

;; message queue
; (defun q-stap-msg (s)
	; (uni-lock *q-lock*)
	; (push-last s *msg-queue*)
	; (uni-unlock *q-lock*))
; (defun check-for-msgs ()
	; (uni-lock *q-lock*)
	; (when *msg-queue*
		; (stap-update (pop *msg-queue*)))
	; (uni-unlock *q-lock*))

;; visicon updates
(defun stap-update (json-string)
	(display-update 'in-progress)
	(model-output "<= ~a" json-string)
	(let ((data (st-json:read-json-from-string json-string)))
		(etypecase data
			(st-json:jso
				(dolist (option (slot-value data 'st-json::alist))
					(cond
						((equal (car option) "require")
							(dolist (required (slot-value (cdr option) 'st-json::alist))
								(cond
									((equal (car required) "options")
										(dolist (option (cdr required))
											(when (not (find option +implemented-options+ :test 'equal))
												(print-warning "This task requires unimplemented option: ~s" option)
												(if *socket* (usocket:socket-close *socket*)))))
									(t
										(print-warning "This task requires something, and i don't know how to handle it:~%    { ~s : ~s }"
											(car required) (cdr required))
										(if *socket* (usocket:socket-close *socket*))))))
						(t
							(print-warning "Ignoring directive { ~s : ~s }" (car option) (cdr option))))))
			(list
				;(model-output "Updating display:~%    ~a" data) 
				(update-element *hierarchical-display* nil data 1)
				(correct-positions))
			((or keyword number string)
				(when (eq data :null)
					(setq *hierarchical-display* (list nil))
					(clear-exp-window)))))
	(model-output "Done updating for ~a" json-string)
	(display-update))

(defun correct-positions ()
	(loop for element in (flatten *hierarchical-display*)
		and position from 0 do
		(typecase element
			(static-text-vdi
				(modify-text-for-exp-window element :y (* position +pixel-offset+)))
			(button-vdi
				(modify-button-for-exp-window element :y (* position +pixel-offset+))))))


;; add/update elements
(defgeneric add-element (key val level))
(defgeneric update-element (container key val level))
;; text and numeric elements
(defmethod add-element (key val level)
	(cons (if key (add-text-to-exp-window :text key :x (* level +pixel-offset+)) (gensym))
		(add-text-to-exp-window :text (format nil "~a" val) :x  (* (1+ level) +pixel-offset+))))
(defmethod update-element (container key val level)
	(cond
		((eq 'button-vdi (type-of (car container)))
			(remove-items-from-exp-window (car container))
			(let ((new-container (add-element key val level)))
				(setf (car container) (car new-container))
				(setf (cdr container) (cdr new-container))))
		((listp (cdr container))
			(apply #'remove-items-from-exp-window (flatten (cdr container)))
			(setf (cdr container) (add-text-to-exp-window :text (format nil "~a" val) :x  (* (1+ level) +pixel-offset+))))
		(t 
			(modify-text-for-exp-window (cdr container) :text (format nil "~a" val)))))
;; boolean elements (i.e. buttons)
(defmethod add-element (key (val (eql :false)) level)
	(list (add-button-to-exp-window :text (or key "") :x  (* level +pixel-offset+) :action #'button-click :color 'blue)))
(defmethod update-element (container key (val (eql :false)) level)
	(when (neq 'button-vdi (type-of (car container)))
		(apply #'remove-items-from-exp-window (flatten container))
		(setf (car container) (car (add-element key val level)))))
;; list elements (i.e. containers)
(defun update-options (key options)
	(if options
		(let ((current-options (or (gethash key *options*) (setf (gethash key *options*) (make-hash-table :test 'equal)))))
			(dolist (o options)
				(setf (gethash (car o) current-options) (cdr o))))))
(defun get-option (key option-name)
	(or
		(let ((options (gethash key *options*)))
			(if options 
				(gethash option-name options)))
		(let ((parent (gethash key *parents*)))
			(if parent
				(get-option (car parent) option-name)))))

(defmethod add-element (key (val list) level)
	(let (  (container (list (if key (add-text-to-exp-window :text key :x (* level +pixel-offset+)) (gensym))))
			(e-lvl (1+ level)) )
		(dolist (e val) (process-element container e e-lvl))
		container))

(defmethod update-element (container key (val list) level)
	(if (eq 'button-vdi (type-of (car container)))
		;; if this element was a button, remove it and replace with list (formed via add-element)
		(progn
			(remove-items-from-exp-window (car container))
			(let ((new-container (add-element key val level)))
				(setf (car container) (car new-container))
				(setf (cdr container) (cdr new-container))))
		(progn
			;; if this element was text/number, replace the value with empty list
			(when (not (listp (cdr container)))
				(remove-items-from-exp-window (cdr container))
				(setf (cdr container) nil))
			;; update all elements in list based on new values
			(let ((e-lvl (1+ level)))
				(dolist (e val) (process-element container e e-lvl)))))
	(if (car container)
		(modify-text-for-exp-window (car container) :height (* (length (flatten (cdr container))) +pixel-offset+))))

(defun process-element (container e e-lvl)
	(if (listp e)
		(if (equal "" (first e)) (setf (first e) nil))
		(setq e (list nil e)))
	(let (	(e-key (first e))
			(e-val :undefined)
			(e-opt nil) )
		(if (> (length e) 1)
			(if (eq 'st-json:jso (type-of (second e)))
				(setq e-opt (slot-value (second e) 'st-json::alist))
				(setq 	e-val (second e)
						e-opt (if (eq 'st-json:jso (type-of (third e))) (slot-value (third e) 'st-json::alist)))))
		;(model-output "?: ~a : ~a ~a" e-key e-val e-opt)
		(let (	(delay (or (assoc "S" e-opt :test 'equal) (assoc "W" e-opt :test 'equal))) )
			(if delay
				(stap-event (if (equal (car delay) "S") (cdr delay) (+ (get-time) (* (cdr delay) 1000)))
						#'(lambda ()
							(display-update 'in-progress)
							(set-key-val-opt container e-key e-val e-opt e-lvl)
							(correct-positions)
							(display-update)))
					; (uni-lock *event-lock*)
					; (push (schedule-event (if (equal (car delay) "S")
									; (/ (cdr delay) 1000)
									; (+ (cdr delay) (get-time)))
									; #'(lambda ()
										; (set-key-val-opt container e-key e-val e-opt e-lvl)
										; (correct-positions)
										; (remove-events)
										; (pause-for-something-to-do)
										; (display-updated)))
						; *stap-event-list*)
					; (uni-unlock *event-lock*))
				(set-key-val-opt container e-key e-val e-opt e-lvl)))))

(defun set-key-val-opt (container e-key e-val e-opt e-lvl)
	(if (eq e-key :true)
		;; if key is a wildcard (:true), change val/opt for all existing elements
		(dolist (e (cdr container))
			(set-key-val-opt container (car e) e-val e-opt e-lvl))
		;; otherwise, set val/opt for the given key
		(let ( (e-container (if (numberp e-key)
								(nth e-key (cdr container))
								(assoc e-key (cdr container) :test 'eql-text))) )
			;(model-output "!: ~a : ~a ~a" e-key e-val e-opt)
			(if (eq e-val :null)
				(when e-container
					; when :null, remove entire element
					(apply #'remove-items-from-exp-window (remove-if 'symbolp (flatten e-container)))
					(remhash (car e-container) *options*)
					(remhash (car e-container) *parents*)
					(remhash (car e-container) *level*)
					(setf (cdr container) (remove e-container (cdr container))))
				(progn
					(if e-container
						;; replace with new value
						(if (neq e-val :undefined)
							(update-element e-container e-key e-val e-lvl))
						;; add new element
						(progn
							(push-last
								(setq e-container
									(add-element
										(if (numberp e-key) nil e-key)
										(if (eq e-val :undefined) :false e-val)
										e-lvl))
								(cdr container))
							(setf (gethash (car e-container) *parents*) container)
							(setf (gethash (car e-container) *level*) e-lvl)
							))
					(update-options (car e-container) e-opt))))))

(defun eql-text (sym-or-str sym-or-text)
	(or (eq sym-or-str sym-or-text)
		(if (not (symbolp sym-or-text)) (equal sym-or-str (DIALOG-ITEM-TEXT sym-or-text)))))



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; TODO: :true wildcard key 
