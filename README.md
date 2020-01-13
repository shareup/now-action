# GitHub action which runs zeit's `now`

## Usage

```yml
name: deploy
on:
  push:

jobs:
  now:
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v2
      - name: now
        id: now
        uses: shareup/now-action@master
        with:
          token: ${{ secrets.zeit_token }}
          prod: ${{ github.ref == 'refs/heads/master' }}
```

## Outputs

* `deployment_url`
* `deployment_id`

## Development

You'll need:

* `node`
* `yarn`
* `hadolint`

On the mac:

```sh
$ brew install node yarn hadolint
```
