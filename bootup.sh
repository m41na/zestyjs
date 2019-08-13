#!/bin/bash
echo setting up enviroment
export JJS=$JAVA_HOME/bin/jjs
$JJS --language=es6 -ot -scripting -J-Djava.class.path=./lib/zesty-router-0.1.1-shaded.jar app.js
