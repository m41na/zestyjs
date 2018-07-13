#!/bin/bash
echo setting up enviroment variables
CLASSPATH=.:./lib
JAVA_HOME=/usr/lib/jvm/java-8-oracle
JAVA=$JAVA_HOME/bin/java
#print java version
#for i in $($JAVA -version); do echo line: $i; done
echo $($JAVA -version)
$JAVA -jar lib/jetty-router-0.1.0-shaded.jar zepress.js
