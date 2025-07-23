 HEAD
#!/bin/bash
uvicorn main:app --host=0.0.0.0 --port=$PORT

#!/bin/bash
uvicorn main:app --host 0.0.0.0 --port 10000
cfe128b (Make start.sh executable)
