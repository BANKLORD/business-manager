// models/Company.js
const { PrismaClient, CompanyIndustryType } = require('@prisma/client');
const prisma = new PrismaClient();

class Company {
  constructor(data) {
    /** Fields */
    this.id = parseInt(data.id);
    this.name = data.name;
    this.ICE = data.ICE;
    this.address = data.address;
    this.zip = data.zip;
    this.city = data.city;
    this.country = data.country;
    this.footerLink = data.footerLink;
    this.logoLink = data.logoLink;
    this.active = data.active;
    this.updatedAt = data.updatedAt;
    this.createdAt = data.createdAt;
    /** Relations */
    this.users = data.users;
    this.roles = data.roles;
    this.brands = data.brands;
    this.categories = data.categories;
    this.concerns = data.concerns;
    this.products = data.products;
    this.sales = data.sales;
    this.purchases = data.purchases;
    this.userLogs = data.userLogs;
    this.Settings = data.Settings;
  }

  static getIndustryTypes = () => {
    const industryTypes = Object.values(CompanyIndustryType);
    return industryTypes.map((type) => {
      const capitalizedType = type.charAt(0) + type.slice(1).toLowerCase();
      return { value: type, text: capitalizedType };
    });
  }

  static findById = async (companyId) => {
    return new Company(await prisma.company.findFirst({ where: { id: parseInt(companyId) }, include: { Settings: true } }));
  }

  static findByName = async (companyName) => {
    return new Company(await prisma.company.findFirst({ where: { name: companyName }, include: { Settings: true } }));
  }

  getUsers = async () => {
    const users = prisma.user.findMany({
      where: { companyId: this.id },
      include: {
        userHasRoles: { include: { role: { include: { RoleHasPermissions: { include: { permission: true } } } } } },

      },
    });
    return users;
  }
  getRoles = async () => {
    const roles = prisma.role.findMany({
      where: { companyId: this.id },
      include: {
        RoleHasPermissions: { include: { permission: { include: { RoleHasPermissions: { include: { permission: true } } } } } },
      },
    });
    return roles;
  }

  static getAll = async () => {
    const companies = await prisma.company.findMany({ include: { Settings: true } });
    return companies.map(company => new Company(company));
  }

  static create = async (companyData, companySettingsData) => {
    companyData = {
      name: companyData.name,
      ICE: companyData.ICE,
      country: companyData.country,
      city: companyData.city,
      address: companyData.address,
      zip: companyData.zip,
      logoLink: companyData.logoLink,
      footerLink: companyData.footerLink,
    }
    const company = await prisma.company.create({ data: companyData });
    if (companySettingsData) {
      companySettingsData = {
        vat: parseFloat(companySettingsData.vat),
        industryType: companySettingsData.industryType,
      }
      companySettingsData.company = { connect: { id: company.id } };
      await prisma.companySettings.create({ data: companySettingsData });
    }
    const createdCompany = { ...company, Settings: companySettingsData };
    return new Company(createdCompany);
  }

  static update = async (companyId, updatedCompanyData, updatedCompanySettingsData) => {
    companyId = parseInt(companyId);
    updatedCompanyData.Settings = undefined;
    let updatedCompany = await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: updatedCompanyData,
    });
    if (updatedCompanySettingsData) {
      updatedCompanySettingsData.company = { connect: { id: parseInt(companyId) } };
      const companySettingsData = {
        vat: parseFloat(updatedCompanySettingsData.vat),
        industryType: updatedCompanySettingsData.industryType,
      }
      if ( updatedCompanySettingsData.id ) {
        const updatedCompanySettings = await prisma.companySettings.update({
          where: { companyId },
          data: companySettingsData,
        });
        updatedCompany = { ...updatedCompany, Settings: updatedCompanySettings };
      } else {
        companySettingsData.company = { connect: { id: companyId } };
        const createdCompanySettings = await prisma.companySettings.create({
          data: companySettingsData,
        });
        updatedCompany = { ...updatedCompany, Settings: createdCompanySettings };
      }
    }
    return new Company(updatedCompany);
  }

  disable = async () => {
    const company = await prisma.company.update({ where: { id: this.id }, data: { active: 0 } });
    return company?true:false;
  }

  activate = async () => {
    const company = await prisma.company.update({ where: { id: this.id }, data: { active: 1 } });
    return company?true:false;
  }

  static exists = async (whereQuery) => {
    const companiesCount = await prisma.company.count({ where: whereQuery });
    return (companiesCount > 0) ?? false;
  }
}

module.exports = Company;
