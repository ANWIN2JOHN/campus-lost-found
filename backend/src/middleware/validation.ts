/**

* Request Validation Middleware
  */

import { Request, Response, NextFunction } from "express";
import Joi, { ObjectSchema } from "joi";

export function validateRequest(schema: ObjectSchema) {
return (req: Request, res: Response, next: NextFunction): void => {
const { error, value } = schema.validate(req.body, {
abortEarly: false,
stripUnknown: true,
});


if (error) {
  const details = error.details.map((detail) => ({
    field: detail.path.join("."),
    message: detail.message,
  }));

  res.status(400).json({
    success: false,
    message: "Validation failed",
    details,
  });
  return;
}

req.body = value;
next();


};
}

/**

* Shared Contact Validation
  */
  const contactValidation = {
  contactType: Joi.string().valid("student", "staff").required(),

// Student fields
studentName: Joi.string()
.allow("")
.when("contactType", {
is: "student",
then: Joi.required(),
otherwise: Joi.optional(),
}),

rollNo: Joi.string()
.allow("")
.when("contactType", {
is: "student",
then: Joi.required(),
otherwise: Joi.optional(),
}),

studentPhone: Joi.string()
.allow("")
.when("contactType", {
is: "student",
then: Joi.required(),
otherwise: Joi.optional(),
}),

studentEmail: Joi.string()
.email()
.allow("")
.when("contactType", {
is: "student",
then: Joi.required(),
otherwise: Joi.optional(),
}),

// Staff fields
staffName: Joi.string()
.allow("")
.when("contactType", {
is: "staff",
then: Joi.required(),
otherwise: Joi.optional(),
}),

employeeId: Joi.string()
.allow("")
.when("contactType", {
is: "staff",
then: Joi.required(),
otherwise: Joi.optional(),
}),

department: Joi.string()
.allow("")
.when("contactType", {
is: "staff",
then: Joi.required(),
otherwise: Joi.optional(),
}),

staffPhone: Joi.string()
.allow("")
.when("contactType", {
is: "staff",
then: Joi.required(),
otherwise: Joi.optional(),
}),

staffEmail: Joi.string()
.email()
.allow("")
.when("contactType", {
is: "staff",
then: Joi.required(),
otherwise: Joi.optional(),
}),
};

/**

* Validation Schemas
  */

export const schemas = {
// Auth schemas
loginSchema: Joi.object({
email: Joi.string().email().required(),
password: Joi.string().min(6).required(),
}),

// Lost item report schema
reportLostItemSchema: Joi.object({
name: Joi.string().trim().required(),
description: Joi.string().trim().required(),
category: Joi.string().required(),
location: Joi.string().trim().required(),
dateLost: Joi.date().required(),


...contactValidation,


}),

// Found item report schema
reportFoundItemSchema: Joi.object({
name: Joi.string().trim().required(),
description: Joi.string().trim().required(),
category: Joi.string().required(),
location: Joi.string().trim().required(),
dateFound: Joi.date().required(),
collectFrom: Joi.string().required(),


...contactValidation,


}),

// Update item status
updateStatusSchema: Joi.object({
status: Joi.string()
.valid("Not Returned", "Returned")
.required(),
returnedBy: Joi.string(),
returnedRollNo: Joi.string(),
}),

// Mark as disposed
markDisposedSchema: Joi.object({
disposalLocation: Joi.string().trim().required(),
donatedTo: Joi.string().trim().allow(""),
notes: Joi.string().trim().allow(""),
}),
};
