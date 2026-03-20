const bcrypt = require('bcryptjs');

const password = '1234';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('✅ Hash generado para password "1234":');
    console.log(hash);
    console.log('\nCopia este hash y úsalo en Neon');
  }
});