const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Category name is required'],
			trim: true,
			maxLength: [100, 'Category name cannot exceed 100 characters'],
		},
		slug: {
			type: String,
			unique: true,
		},
		description: {
			type: String,
			trim: true,
		},
		parent: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Category',
			default: null,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Create slug from name
categorySchema.pre('save', function (next) {
	if (this.isModified('name')) {
		this.slug = slugify(this.name, { lower: true, strict: true });
	}
	next();
});

module.exports = mongoose.model('Category', categorySchema);
