develop:
  while true; do npx quartz build --directory ~/repositories/wiki-infai/ --concurrency 7 --watch --serve --port 9323; sleep 2; done

build:
  npm install
  npx quartz build --directory ~/repositories/wiki-infai/ --concurrency 7
