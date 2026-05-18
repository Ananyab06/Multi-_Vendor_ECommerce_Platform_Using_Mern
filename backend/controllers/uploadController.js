exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  res.status(201).json({ url });
};
