const axios = require('axios');

(async () => {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/chat/completions',
      {
        model: 'siyena',
        messages: [{ role: 'user', content: 'Hello' }]
      },
      {
        headers: {
          'Authorization': 'Bearer sk-6422f30a70524ade991cc66a51f613bf',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log("Success:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error Message:", error.message);
    if (error.response) {
      console.error("Error Response Data:", JSON.stringify(error.response.data, null, 2));
      console.error("Error Response Status:", error.response.status);
    }
  }
})();
