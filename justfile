develop:
  while true; do npx quartz build --directory ~/repositories/wiki-infai/ --concurrency 7 --watch --serve --port 9000; sleep 2; done

build:
  npx quartz build --directory ~/repositories/wiki-infai/ --concurrency 7
