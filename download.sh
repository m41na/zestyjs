#!/bin/bash
#
#This script will do the followin tasks
#
#1. check if the currenct directory is writable (for download)
#2. if check fails, exit script
#3. create a variable for the name of the the target folder - ZESTY_HOME
#4. check if the target folder exists
#5. if it exists, it will attempt to delete the folder
#6. if the deletion fails, the script exits - you need to remove this folder manually
#7. check if you have JAVA_HOME set
#8. check your version of java (recommended min sdk 1.9)
#9. if check fails, exit script
#10. check if M2_HOME or MAVEN_HOME is set
#11. check your versionof maven (recommended min 3.6.1)
#12. if check fails, exit script
#13. download latest version of zesty-router from github into the currenct folder
#14. change into ZESTY_HOME folder and execute 'mvn clean package -U'
#15. if the build fails, the script navigates back to the parent folder and exits
#16. if the build is successful, navigate back the the parent folder.
#17. copy shaded jar from ZESTY_HOME/target into the current directory
#18. if the move operation fails, the script exits
#19. delete the sources downloaded from github
#20. notify user of succesful operation
#21. exit script
#
echo
set -e

if [ -w `pwd` ]; then 
	echo "$(pwd) is WRITABLE"; 
	echo
else 
	echo "the current directory is NOT WRITABLE"; 
	exit
fi

ZESTY_HOME="zesty-router"
if [ -d $ZESTY_HOME ] ; then 
	rm -rf $ZESTY_HOME;
fi

if [ $? -ne 0 ] ; then
	echo remove the existing $ZESTY_HOME before proceeding
	exit
fi

javaHome=$JAVA_HOME
if [ -z $javaHome ] ; then
	echo no java home was found
	exit 1
fi

echo java version found $javaHome
echo

mavenHome=$M2_HOME
if [ -z $mavenHome ] ; then
	echo M2_HOME not found. Try MAVEN_HOME instead
	echo
	
	mavenHome=$MAVEN_HOME
	if [ -z $mavenHome ] ; then
		echo maven home not found
		exit 1
	fi
fi

echo maven version found $mavenHome
echo

git clone https://github.com/m41na/zesty-router.git

if [ $? -ne 0 ] ; then
	echo the download did not complete successsfully
	exit 1
fi

cd $ZESTY_HOME

if [ -e pom.xml ] ; then
	echo pom.xml file exists. the build process will now commence
	echo
else
	echo pom.xml file does not exist
	exit 1
fi

echo start building project artifacts
echo 

mvn clean package -U -DskipTests

if [ $? -ne 0 ] ; then
	echo the build did not complete successsfully
	cd ..
	exit 1
fi

cd ..

echo moving the built jar file to the current directory
echo

mv $ZESTY_HOME/target/zesty*shaded.jar .

if [ $? -ne 0 ] ; then
	echo the built library was not copied successsfully
	exit 1
fi

rm -rf $ZESTY_HOME

echo all done!