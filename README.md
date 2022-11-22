<p align="center">
  <img width="250px" src="https://user-images.githubusercontent.com/13738772/201432652-63a10fc1-a6a5-423f-8ee0-b18a11308077.svg" />  
<p align="center">


## Create a Neon Branch 🚀
This gitHub action creates a new Neon branch.

Here is an example of how to use it:

```yml
name: Create Neon Branch with GitHub Actions Demo
run-name: Create a Neon Branch 🚀
on: [push]
jobs:
  Create-Neon-Branch:
    uses: neondatabase/create-branch-action@beta
    with:
      project_id: rapid-haze-373089
      parent_id: br-long-forest-224191
      branch_name: from_action_reusable
      api_key: {{ secrets.NEON_API_KEY }}
```
  
## How to set up the NEON_API_KEY
Navigate to you the Account page on your Neon console. In the Developer Settings, Generate a new API key if you don't have one already. 
It's important not to share the API key or expose it in your actions or code. This is why you need to add the API key to a new GitHub secret.  

In your GitHub repo, go to `Settings` and and locate `Secrets` at the bottom of the left side bar. Click on `Actions` then on the `New repository secret` button to create a new  secret.
Name the secret `NEON_API_KEY` and paste the API key generated on the Neon console in the `Secret*` field, then press `Add secret` button.
