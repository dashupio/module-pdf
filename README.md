Dashup Module PDF
&middot;
[![Latest Github release](https://img.shields.io/github/release/dashup/module-pdf.svg)](https://github.com/dashup/module-pdf/releases/latest)
=====

A connect interface for pdf on [dashup](https://dashup.io).

## Contents
* [Get Started](#get-started)
* [Connect interface](#connect)

## Get Started

This pdf connector adds pdfs functionality to Dashup pdfs:

```json
{
  "url" : "https://dashup.io",
  "key" : "[dashup module key here]"
}
```

To start the connection to dashup:

`npm run start`

## Deployment

1. `docker build -t dashup/module-pdf .`
2. `docker run -d -v /path/to/.dashup.json:/usr/src/module/.dashup.json dashup/module-pdf`