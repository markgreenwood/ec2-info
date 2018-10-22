const AWS = require('aws-sdk');
const R = require('ramda');
const fs = require('fs');

AWS.config.setPromisesDependency(Promise);

const ec2 = new AWS.EC2({ region: 'us-west-2' });

const tap = response => {
  console.log(JSON.stringify(response, null, 2));
  return response;
};

const params = {
  // Filters: [
  //   {
  //     Name: 'instance-type',
  //     Values: ['c4.xlarge']
  //   }
  // ]
};

const findInstanceId = R.compose(R.find, R.propEq('InstanceId'));

ec2.describeInstances(params).promise()
  .then(R.prop('Reservations'))
  .then(R.compose(R.flatten, R.pluck('Instances')))
  .then(tap)
  .then(R.map(R.pick(['InstanceId', 'Tags', 'State'])))
  .then(R.map(item => R.merge(item, {
    Name: R.prop('Value', R.find(R.propEq('Key', 'Name'), item.Tags)),
    State: R.path(['State', 'Name'], item)
  })))
  .then(R.map(R.pick(['InstanceId', 'Name', 'State'])))
  .then(tap)
  .then(response => {
    const instances = R.map(item => `${item.InstanceId},${item.Name},${item.State}`, response);
    fs.writeFileSync('instances.csv', R.join('\n', R.concat(['InstanceId,Name,State'], instances)));
  })
  .catch(console.log);
