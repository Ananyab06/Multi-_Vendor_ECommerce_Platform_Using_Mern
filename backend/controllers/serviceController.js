const Service = require('../models/Service');

const transformService = (serviceDoc) => {
  const vendor = serviceDoc.vendorId
    ? serviceDoc.vendorId.storeName || serviceDoc.vendorId.name
    : 'Unknown Vendor';

  return {
    id: serviceDoc._id.toString(),
    name: serviceDoc.name,
    price: serviceDoc.price,
    originalPrice: serviceDoc.originalPrice,
    rating: serviceDoc.rating,
    reviews: serviceDoc.reviews,
    vendor,
    vendorId: serviceDoc.vendorId?._id?.toString() || serviceDoc.vendorId?.toString(),
    category: serviceDoc.category,
    description: serviceDoc.description,
    image: serviceDoc.image,
    isActive: serviceDoc.isActive !== undefined ? serviceDoc.isActive : true,
  };
};

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().populate('vendorId', 'name storeName');
    res.json(services.map(transformService));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('vendorId', 'name storeName');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(transformService(service));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createService = async (req, res) => {
  try {
    const { name, description, price, originalPrice, image, category, rating, reviews, isActive } = req.body;
    const vendorId = req.vendor.id;

    const service = new Service({
      name,
      description: description || '',
      price,
      originalPrice,
      image: image || '',
      category: category || 'Services',
      vendorId,
      rating: rating ?? 4.8,
      reviews: reviews ?? 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    await service.save();
    const populated = await Service.findById(service._id).populate('vendorId', 'name storeName');
    const transformed = transformService(populated);

    const { broadcastServiceAdded } = require('../socket');
    broadcastServiceAdded(transformed);

    res.status(201).json({ message: 'Service created', service: transformed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.vendorId.toString() !== req.vendor.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, description, price, originalPrice, image, category, rating, reviews, isActive } = req.body;
    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (originalPrice !== undefined) service.originalPrice = originalPrice;
    if (image !== undefined) service.image = image;
    if (category !== undefined) service.category = category;
    if (rating !== undefined) service.rating = rating;
    if (reviews !== undefined) service.reviews = reviews;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();
    const populated = await Service.findById(service._id).populate('vendorId', 'name storeName');
    const transformed = transformService(populated);

    const { broadcastServiceUpdated } = require('../socket');
    broadcastServiceUpdated(transformed);

    res.json({ message: 'Service updated', service: transformed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.vendorId.toString() !== req.vendor.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const serviceId = service._id.toString();
    await service.deleteOne();

    const { broadcastServiceDeleted } = require('../socket');
    broadcastServiceDeleted(serviceId);

    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
