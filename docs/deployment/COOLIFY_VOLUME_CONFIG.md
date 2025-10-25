# Coolify Volume Configuration

## Required Volume Mapping

In Coolify dashboard:
1. Open AutoLeads application
2. Go to "Volumes" tab
3. Add new volume:
   - **Name:** autoleads-uploads
   - **Host Path:** /var/lib/coolify/volumes/autoleads-uploads
   - **Container Path:** /app/uploads
   - **Read Only:** NO (unchecked)
4. Save and redeploy

## Verification After Deploy
```bash
# Test persistence
docker exec <container-id> sh -c "echo 'test' > /app/uploads/test.txt"
docker restart <container-id>
docker exec <container-id> cat /app/uploads/test.txt
# Should output: test
```
