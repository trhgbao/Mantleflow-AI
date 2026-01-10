from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date


class InvoiceItem(BaseModel):
    """Single line item in an invoice"""
    description: str = Field(..., description="Item description")
    quantity: float = Field(default=1, description="Quantity")
    unit_price: float = Field(..., description="Unit price")
    total: float = Field(..., description="Line total")


class DebtorInfo(BaseModel):
    """Debtor (buyer) information"""
    name: str = Field(..., description="Company name")
    tax_id: Optional[str] = Field(None, description="Tax ID / Business registration number")
    address: Optional[str] = Field(None, description="Company address")
    email: Optional[str] = Field(None, description="Contact email")
    phone: Optional[str] = Field(None, description="Contact phone")


class CreditorInfo(BaseModel):
    """Creditor (seller) information"""
    name: str = Field(..., description="Company name")
    tax_id: Optional[str] = Field(None, description="Tax ID")
    address: Optional[str] = Field(None, description="Company address")


class ExtractedInvoice(BaseModel):
    """Extracted invoice data from OCR"""
    invoice_number: str = Field(..., description="Invoice number/ID")
    amount: float = Field(..., description="Total invoice amount")
    currency: str = Field(default="VND", description="Currency code")
    debtor: DebtorInfo = Field(..., description="Debtor information")
    creditor: Optional[CreditorInfo] = Field(None, description="Creditor information")
    issue_date: Optional[str] = Field(None, description="Invoice issue date")
    due_date: Optional[str] = Field(None, description="Payment due date")
    items: List[InvoiceItem] = Field(default=[], description="Line items")
    confidence: float = Field(default=0.0, description="OCR confidence score 0-1")


class ExtractRequest(BaseModel):
    """Request for invoice extraction"""
    file_base64: Optional[str] = Field(None, description="Base64 encoded file content")
    file_type: str = Field(..., description="File type: pdf, docx, xlsx, png, jpg")
    filename: str = Field(..., description="Original filename")


class ExtractResponse(BaseModel):
    """Response from invoice extraction"""
    success: bool
    data: Optional[ExtractedInvoice] = None
    error: Optional[str] = None
    raw_text: Optional[str] = None
