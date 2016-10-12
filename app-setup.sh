# update instance
yum -y update

echo "Installing nodejs to yum"
curl --silent --location https://rpm.nodesource.com/setup_4.x | bash -
yum -y install nodejs

echo "Installing packages"
sudo npm install

echo "Installed required packages"

