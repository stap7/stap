
;;model that finds and clicks buttons

(defvar *clicks* 0)

(clear-all)
(define-model button-clicker
  
  (start-hand-at-mouse)

  (p start
     ?goal>
      buffer empty
     ?manual>
      state free
     ==>
	 +goal>
	  isa chunk
     +visual-location>
      isa visual-location 
	  color blue)
  
  (p found-link
     =goal>
      isa chunk
     =visual-location>
      isa visual-location
      color blue
     ?visual>
      state free
     ==>
	 -goal>
     +visual>
      isa move-attention
      screen-pos =visual-location)
  
  (p attended-link
     ?goal>
      buffer empty
     =visual>
	  color blue
     ?manual>
      state free
     ==>
	 +goal>
	  isa chunk
     +manual>
      isa move-cursor
      object =visual)
  
  (p click-link
     =goal>
      isa chunk
     ?manual>
      state free
     ?visual>
      state free
     ==>
	!eval! (model-output "CLICKING")
	!eval! (incf *clicks*)
     +manual>
      isa click-mouse
	 +visual-location>
      isa visual-location 
	  color blue)
  
  )
  
