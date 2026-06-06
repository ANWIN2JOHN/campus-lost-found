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
    contactType: Joi.string().valid("student", "staff").required(),
    studentName: Joi.string().when("contactType", {
      is: "student",
      then: Joi.required(),
    }),
    rollNo: Joi.string().when("contactType", {
      is: "student",
      then: Joi.required(),
    }),
    studentPhone: Joi.string().when("contactType", {
      is: "student",
      then: Joi.required(),
    }),
    studentEmail: Joi.string().email().when("contactType", {
      is: "student",
      then: Joi.required(),
    }),
    staffName: Joi.string().when("contactType", {
      is: "staff",
      then: Joi.required(),
    }),
    employeeId: Joi.string().when("contactType", {
      is: "staff",
      then: Joi.required(),
    }),
    department: Joi.string().when("contactType", {
      is: "staff",
      then: Joi.required(),
    }),
    staffPhone: Joi.string().when("contactType", {
      is: "staff",
      then: Joi.required(),
    }),
    staffEmail: Joi.string().email().when("contactType", {
      is: "staff",
      then: Joi.required(),
    }),
  }),

  // Found item report schema
  reportFoundItemSchema: Joi.object({
    name: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    category: Joi.string().required(),
    location: Joi.string().trim().required(),
    dateFound: Joi.date().required(),
    collectFrom: Joi.string().required(),
    contactType: Joi.string().valid("student", "staff").required(),
    studentName: Joi.string().when("contactType", {
      is: "student",
      then: Joi.required(),
    }),
    rollNo: Joi.string().when("contactType", {
      is: "student",
      then: Joi.required(),
    }),
    studentPhone: Joi.string().when("contactType", {
      is: "student",
      then: Joi.required(),
    }),
    studentEmail: Joi.string().email().when("contactType", {
      is: "student",
      then: Joi.required(),
    }),
    staffName: Joi.string().when("contactType", {
      is: "staff",
      then: Joi.required(),
    }),
    employeeId: Joi.string().when("contactType", {
      is: "staff",
      then: Joi.required(),
    }),
    department: Joi.string().when("contactType", {
      is: "staff",
      then: Joi.required(),
    }),
    staffPhone: Joi.string().when("contactType", {
      is: "staff",
      then: Joi.required(),
    }),
    staffEmail: Joi.string().email().when("contactType", {
      is: "staff",
      then: Joi.required(),
    }),
  }),

  // Update item status
  updateStatusSchema: Joi.object({
    status: Joi.string().valid("Not Returned", "Returned").required(),
    returnedBy: Joi.string(),
    returnedRollNo: Joi.string(),
  }),

  // Mark as disposed
  markDisposedSchema: Joi.object({
    disposalLocation: Joi.string().trim().required(),
    donatedTo: Joi.string().trim(),
    notes: Joi.string().trim(),
  }),
};
