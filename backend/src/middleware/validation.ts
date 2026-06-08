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

const nameValidator = Joi.string()
  .trim()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-Z\s'-]+$/)
  .messages({
    "string.pattern.base": '"{{#label}}" can only contain letters, spaces, hyphens, and apostrophes',
    "string.min": '"{{#label}}" must be at least 2 characters',
    "string.max": '"{{#label}}" must not exceed 50 characters',
  });

const phoneValidator = Joi.string()
  .trim()
  .pattern(/^\+?[0-9\s()-]+$/)
  .custom((value, helpers) => {
    if (!value) return value;
    const digits = value.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      return helpers.error("string.min");
    }
    return value;
  })
  .messages({
    "string.pattern.base": '"{{#label}}" can only contain numbers, spaces, hyphens, parentheses, and a leading "+"',
    "string.min": '"{{#label}}" must contain between 7 and 15 digits',
  });

const emailValidator = Joi.string()
  .trim()
  .email()
  .lowercase()
  .messages({
    "string.email": '"{{#label}}" must be a valid email address',
  });

/**
 * Shared Contact Validation
 */
const contactValidation = {
  contactType: Joi.string().valid("student", "staff").required(),

  // Student fields
  studentName: nameValidator
    .when("contactType", {
      is: "student",
      then: Joi.required(),
      otherwise: Joi.optional().allow(""),
    }),

  rollNo: Joi.string()
    .trim()
    .allow("")
    .when("contactType", {
      is: "student",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  studentPhone: phoneValidator
    .when("contactType", {
      is: "student",
      then: Joi.required(),
      otherwise: Joi.optional().allow(""),
    }),

  studentEmail: emailValidator
    .when("contactType", {
      is: "student",
      then: Joi.required(),
      otherwise: Joi.optional().allow(""),
    }),

  // Staff fields
  staffName: nameValidator
    .when("contactType", {
      is: "staff",
      then: Joi.required(),
      otherwise: Joi.optional().allow(""),
    }),

  employeeId: Joi.string()
    .trim()
    .allow("")
    .when("contactType", {
      is: "staff",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  department: Joi.string()
    .trim()
    .allow("")
    .when("contactType", {
      is: "staff",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  staffPhone: phoneValidator
    .when("contactType", {
      is: "staff",
      then: Joi.required(),
      otherwise: Joi.optional().allow(""),
    }),

  staffEmail: emailValidator
    .when("contactType", {
      is: "staff",
      then: Joi.required(),
      otherwise: Joi.optional().allow(""),
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
    // Lost item update status fields
    returnedBy: nameValidator.optional().allow(""),
    returnedRollNo: Joi.string().trim().optional().allow(""),
    // Found item update status fields
    claimedBy: nameValidator.optional().allow(""),
    claimedRollNo: Joi.string().trim().optional().allow(""),
    claimedPhone: phoneValidator.optional().allow(""),
    claimedEmail: emailValidator.optional().allow(""),
  }),

  // Mark as disposed
  markDisposedSchema: Joi.object({
    disposalLocation: Joi.string().trim().required(),
    donatedTo: Joi.string().trim().allow(""),
    notes: Joi.string().trim().allow(""),
  }),
};
