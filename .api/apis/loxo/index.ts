import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'loxo/1.2.5 (api/6.1.2)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  activity_typesIndex(metadata: types.ActivityTypesIndexMetadataParam): Promise<FetchResponse<200, types.ActivityTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/activity_types', 'get', metadata);
  }

  address_typesIndex(metadata: types.AddressTypesIndexMetadataParam): Promise<FetchResponse<200, types.AddressTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/address_types', 'get', metadata);
  }

  bonus_payment_typesIndex(metadata: types.BonusPaymentTypesIndexMetadataParam): Promise<FetchResponse<200, types.BonusPaymentTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/bonus_payment_types', 'get', metadata);
  }

  bonus_typesIndex(metadata: types.BonusTypesIndexMetadataParam): Promise<FetchResponse<200, types.BonusTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/bonus_types', 'get', metadata);
  }

  companiesIndex(metadata: types.CompaniesIndexMetadataParam): Promise<FetchResponse<200, types.CompaniesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/companies', 'get', metadata);
  }

  companiesCreate(body: types.CompaniesCreateBodyParam, metadata: types.CompaniesCreateMetadataParam): Promise<FetchResponse<200, types.CompaniesCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/companies', 'post', body, metadata);
  }

  company_addressesCreate(body: types.CompanyAddressesCreateBodyParam, metadata: types.CompanyAddressesCreateMetadataParam): Promise<FetchResponse<200, types.CompanyAddressesCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/addresses', 'post', body, metadata);
  }

  company_addressesIndex(metadata: types.CompanyAddressesIndexMetadataParam): Promise<FetchResponse<200, types.CompanyAddressesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/addresses', 'get', metadata);
  }

  company_addressesShow(metadata: types.CompanyAddressesShowMetadataParam): Promise<FetchResponse<200, types.CompanyAddressesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/addresses/{id}', 'get', metadata);
  }

  company_addressesUpdate(body: types.CompanyAddressesUpdateBodyParam, metadata: types.CompanyAddressesUpdateMetadataParam): Promise<FetchResponse<200, types.CompanyAddressesUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/addresses/{id}', 'put', body, metadata);
  }

  company_addressesDestroy(metadata: types.CompanyAddressesDestroyMetadataParam): Promise<FetchResponse<200, types.CompanyAddressesDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/addresses/{id}', 'delete', metadata);
  }

  company_documentsCreate(body: types.CompanyDocumentsCreateBodyParam, metadata: types.CompanyDocumentsCreateMetadataParam): Promise<FetchResponse<200, types.CompanyDocumentsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/documents', 'post', body, metadata);
  }

  company_documentsDownload(metadata: types.CompanyDocumentsDownloadMetadataParam): Promise<FetchResponse<200, types.CompanyDocumentsDownloadResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/documents/{company_document_id}/download', 'get', metadata);
  }

  company_documentsDestroy(metadata: types.CompanyDocumentsDestroyMetadataParam): Promise<FetchResponse<200, types.CompanyDocumentsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/documents/{id}', 'delete', metadata);
  }

  company_emailsIndex(metadata: types.CompanyEmailsIndexMetadataParam): Promise<FetchResponse<200, types.CompanyEmailsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/emails', 'get', metadata);
  }

  company_emailsCreate(body: types.CompanyEmailsCreateBodyParam, metadata: types.CompanyEmailsCreateMetadataParam): Promise<FetchResponse<200, types.CompanyEmailsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/emails', 'post', body, metadata);
  }

  company_emailsShow(metadata: types.CompanyEmailsShowMetadataParam): Promise<FetchResponse<200, types.CompanyEmailsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/emails/{id}', 'get', metadata);
  }

  company_emailsUpdate(body: types.CompanyEmailsUpdateBodyParam, metadata: types.CompanyEmailsUpdateMetadataParam): Promise<FetchResponse<200, types.CompanyEmailsUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/emails/{id}', 'put', body, metadata);
  }

  company_emailsDestroy(metadata: types.CompanyEmailsDestroyMetadataParam): Promise<FetchResponse<200, types.CompanyEmailsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/emails/{id}', 'delete', metadata);
  }

  company_peopleIndex(metadata: types.CompanyPeopleIndexMetadataParam): Promise<FetchResponse<200, types.CompanyPeopleIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/people', 'get', metadata);
  }

  company_phonesIndex(metadata: types.CompanyPhonesIndexMetadataParam): Promise<FetchResponse<200, types.CompanyPhonesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/phones', 'get', metadata);
  }

  company_phonesCreate(body: types.CompanyPhonesCreateBodyParam, metadata: types.CompanyPhonesCreateMetadataParam): Promise<FetchResponse<200, types.CompanyPhonesCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/phones', 'post', body, metadata);
  }

  company_phonesUpdate(body: types.CompanyPhonesUpdateBodyParam, metadata: types.CompanyPhonesUpdateMetadataParam): Promise<FetchResponse<200, types.CompanyPhonesUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/phones/{id}', 'put', body, metadata);
  }

  company_phonesShow(metadata: types.CompanyPhonesShowMetadataParam): Promise<FetchResponse<200, types.CompanyPhonesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/phones/{id}', 'get', metadata);
  }

  company_phonesDestroy(metadata: types.CompanyPhonesDestroyMetadataParam): Promise<FetchResponse<200, types.CompanyPhonesDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{company_id}/phones/{id}', 'delete', metadata);
  }

  companiesUpdate(body: types.CompaniesUpdateBodyParam, metadata: types.CompaniesUpdateMetadataParam): Promise<FetchResponse<200, types.CompaniesUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{id}', 'put', body, metadata);
  }

  companiesShow(metadata: types.CompaniesShowMetadataParam): Promise<FetchResponse<200, types.CompaniesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/companies/{id}', 'get', metadata);
  }

  company_global_statusesIndex(metadata: types.CompanyGlobalStatusesIndexMetadataParam): Promise<FetchResponse<200, types.CompanyGlobalStatusesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/company_global_statuses', 'get', metadata);
  }

  company_typesIndex(metadata: types.CompanyTypesIndexMetadataParam): Promise<FetchResponse<200, types.CompanyTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/company_types', 'get', metadata);
  }

  compensation_typesIndex(metadata: types.CompensationTypesIndexMetadataParam): Promise<FetchResponse<200, types.CompensationTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/compensation_types', 'get', metadata);
  }

  countriesIndex(metadata: types.CountriesIndexMetadataParam): Promise<FetchResponse<200, types.CountriesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/countries', 'get', metadata);
  }

  statesIndex(metadata: types.StatesIndexMetadataParam): Promise<FetchResponse<200, types.StatesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/countries/{country_id}/states', 'get', metadata);
  }

  citiesIndex(metadata: types.CitiesIndexMetadataParam): Promise<FetchResponse<200, types.CitiesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/countries/{country_id}/states/{state_id}/cities', 'get', metadata);
  }

  currenciesIndex(metadata: types.CurrenciesIndexMetadataParam): Promise<FetchResponse<200, types.CurrenciesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/currencies', 'get', metadata);
  }

  deal_workflowsIndex(metadata: types.DealWorkflowsIndexMetadataParam): Promise<FetchResponse<200, types.DealWorkflowsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/deal_workflows', 'get', metadata);
  }

  deal_workflowsShow(metadata: types.DealWorkflowsShowMetadataParam): Promise<FetchResponse<200, types.DealWorkflowsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/deal_workflows/{id}', 'get', metadata);
  }

  dealsCreate(body: types.DealsCreateBodyParam, metadata: types.DealsCreateMetadataParam): Promise<FetchResponse<200, types.DealsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/deals', 'post', body, metadata);
  }

  dealsIndex(metadata: types.DealsIndexMetadataParam): Promise<FetchResponse<200, types.DealsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/deals', 'get', metadata);
  }

  deal_eventsCreate(body: types.DealEventsCreateBodyParam, metadata: types.DealEventsCreateMetadataParam): Promise<FetchResponse<200, types.DealEventsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/deals/{deal_id}/events', 'post', body, metadata);
  }

  dealsShow(metadata: types.DealsShowMetadataParam): Promise<FetchResponse<200, types.DealsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/deals/{id}', 'get', metadata);
  }

  disability_statusesIndex(metadata: types.DisabilityStatusesIndexMetadataParam): Promise<FetchResponse<200, types.DisabilityStatusesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/disability_statuses', 'get', metadata);
  }

  diversity_typesIndex(metadata: types.DiversityTypesIndexMetadataParam): Promise<FetchResponse<200, types.DiversityTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/diversity_types', 'get', metadata);
  }

  dynamic_fieldsIndex(metadata: types.DynamicFieldsIndexMetadataParam): Promise<FetchResponse<200, types.DynamicFieldsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/dynamic_fields', 'get', metadata);
  }

  hierarchiesIndex(metadata: types.HierarchiesIndexMetadataParam): Promise<FetchResponse<200, types.HierarchiesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/dynamic_fields/{dynamic_field_id}/hierarchies', 'get', metadata);
  }

  hierarchiesCreate(body: types.HierarchiesCreateBodyParam, metadata: types.HierarchiesCreateMetadataParam): Promise<FetchResponse<200, types.HierarchiesCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/dynamic_fields/{dynamic_field_id}/hierarchies', 'post', body, metadata);
  }

  hierarchiesDestroy(metadata: types.HierarchiesDestroyMetadataParam): Promise<FetchResponse<200, types.HierarchiesDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/dynamic_fields/{dynamic_field_id}/hierarchies/{id}', 'delete', metadata);
  }

  hierarchiesShow(metadata: types.HierarchiesShowMetadataParam): Promise<FetchResponse<200, types.HierarchiesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/dynamic_fields/{dynamic_field_id}/hierarchies/{id}', 'get', metadata);
  }

  hierarchiesUpdate(body: types.HierarchiesUpdateBodyParam, metadata: types.HierarchiesUpdateMetadataParam): Promise<FetchResponse<200, types.HierarchiesUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/dynamic_fields/{dynamic_field_id}/hierarchies/{id}', 'put', body, metadata);
  }

  dynamic_fieldsShow(metadata: types.DynamicFieldsShowMetadataParam): Promise<FetchResponse<200, types.DynamicFieldsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/dynamic_fields/{id}', 'get', metadata);
  }

  education_typesIndex(metadata: types.EducationTypesIndexMetadataParam): Promise<FetchResponse<200, types.EducationTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/education_types', 'get', metadata);
  }

  email_trackingIndex(metadata: types.EmailTrackingIndexMetadataParam): Promise<FetchResponse<200, types.EmailTrackingIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/email_tracking', 'get', metadata);
  }

  email_typesIndex(metadata: types.EmailTypesIndexMetadataParam): Promise<FetchResponse<200, types.EmailTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/email_types', 'get', metadata);
  }

  equity_typesIndex(metadata: types.EquityTypesIndexMetadataParam): Promise<FetchResponse<200, types.EquityTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/equity_types', 'get', metadata);
  }

  ethnicitiesIndex(metadata: types.EthnicitiesIndexMetadataParam): Promise<FetchResponse<200, types.EthnicitiesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/ethnicities', 'get', metadata);
  }

  fee_typesIndex(metadata: types.FeeTypesIndexMetadataParam): Promise<FetchResponse<200, types.FeeTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/fee_types', 'get', metadata);
  }

  form_templatesIndex(metadata: types.FormTemplatesIndexMetadataParam): Promise<FetchResponse<200, types.FormTemplatesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/form_templates', 'get', metadata);
  }

  form_templatesShow(metadata: types.FormTemplatesShowMetadataParam): Promise<FetchResponse<200, types.FormTemplatesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/form_templates/{id}', 'get', metadata);
  }

  formsCreate(body: types.FormsCreateBodyParam, metadata: types.FormsCreateMetadataParam): Promise<FetchResponse<200, types.FormsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/forms', 'post', body, metadata);
  }

  formsIndex(metadata: types.FormsIndexMetadataParam): Promise<FetchResponse<200, types.FormsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/forms', 'get', metadata);
  }

  formsShow(metadata: types.FormsShowMetadataParam): Promise<FetchResponse<200, types.FormsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/forms/{id}', 'get', metadata);
  }

  formsUpdate(body: types.FormsUpdateBodyParam, metadata: types.FormsUpdateMetadataParam): Promise<FetchResponse<200, types.FormsUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/forms/{id}', 'put', body, metadata);
  }

  formsDestroy(metadata: types.FormsDestroyMetadataParam): Promise<FetchResponse<200, types.FormsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/forms/{id}', 'delete', metadata);
  }

  gendersIndex(metadata: types.GendersIndexMetadataParam): Promise<FetchResponse<200, types.GendersIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/genders', 'get', metadata);
  }

  job_categoriesIndex(metadata: types.JobCategoriesIndexMetadataParam): Promise<FetchResponse<200, types.JobCategoriesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/job_categories', 'get', metadata);
  }

  job_contact_typesIndex(metadata: types.JobContactTypesIndexMetadataParam): Promise<FetchResponse<200, types.JobContactTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/job_contact_types', 'get', metadata);
  }

  job_listing_configIndex(metadata: types.JobListingConfigIndexMetadataParam): Promise<FetchResponse<200, types.JobListingConfigIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/job_listing_config', 'get', metadata);
  }

  job_owner_typesIndex(metadata: types.JobOwnerTypesIndexMetadataParam): Promise<FetchResponse<200, types.JobOwnerTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/job_owner_types', 'get', metadata);
  }

  job_statusesIndex(metadata: types.JobStatusesIndexMetadataParam): Promise<FetchResponse<200, types.JobStatusesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/job_statuses', 'get', metadata);
  }

  job_typesIndex(metadata: types.JobTypesIndexMetadataParam): Promise<FetchResponse<200, types.JobTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/job_types', 'get', metadata);
  }

  jobsCreate(body: types.JobsCreateBodyParam, metadata: types.JobsCreateMetadataParam): Promise<FetchResponse<200, types.JobsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs', 'post', body, metadata);
  }

  jobsIndex(metadata: types.JobsIndexMetadataParam): Promise<FetchResponse<200, types.JobsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs', 'get', metadata);
  }

  jobsDestroy(metadata: types.JobsDestroyMetadataParam): Promise<FetchResponse<200, types.JobsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{id}', 'delete', metadata);
  }

  jobsShow(metadata: types.JobsShowMetadataParam): Promise<FetchResponse<200, types.JobsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{id}', 'get', metadata);
  }

  jobsUpdate(body: types.JobsUpdateBodyParam, metadata: types.JobsUpdateMetadataParam): Promise<FetchResponse<200, types.JobsUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{id}', 'put', body, metadata);
  }

  jobsApply(body: types.JobsApplyBodyParam, metadata: types.JobsApplyMetadataParam): Promise<FetchResponse<200, types.JobsApplyResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/apply', 'post', body, metadata);
  }

  candidatesIndex(metadata: types.CandidatesIndexMetadataParam): Promise<FetchResponse<200, types.CandidatesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/candidates', 'get', metadata);
  }

  candidatesShow(metadata: types.CandidatesShowMetadataParam): Promise<FetchResponse<200, types.CandidatesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/candidates/{id}', 'get', metadata);
  }

  candidatesUpdate(body: types.CandidatesUpdateBodyParam, metadata: types.CandidatesUpdateMetadataParam): Promise<FetchResponse<200, types.CandidatesUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/candidates/{id}', 'put', body, metadata);
  }

  job_contactsCreate(body: types.JobContactsCreateBodyParam, metadata: types.JobContactsCreateMetadataParam): Promise<FetchResponse<200, types.JobContactsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/contacts', 'post', body, metadata);
  }

  job_contactsIndex(metadata: types.JobContactsIndexMetadataParam): Promise<FetchResponse<200, types.JobContactsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/contacts', 'get', metadata);
  }

  job_contactsUpdate(body: types.JobContactsUpdateBodyParam, metadata: types.JobContactsUpdateMetadataParam): Promise<FetchResponse<200, types.JobContactsUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/contacts/{id}', 'put', body, metadata);
  }

  job_contactsDestroy(metadata: types.JobContactsDestroyMetadataParam): Promise<FetchResponse<200, types.JobContactsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/contacts/{id}', 'delete', metadata);
  }

  job_documentsCreate(body: types.JobDocumentsCreateBodyParam, metadata: types.JobDocumentsCreateMetadataParam): Promise<FetchResponse<200, types.JobDocumentsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/documents', 'post', body, metadata);
  }

  job_documentsDestroy(metadata: types.JobDocumentsDestroyMetadataParam): Promise<FetchResponse<200, types.JobDocumentsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/documents/{id}', 'delete', metadata);
  }

  job_documentsDownload(metadata: types.JobDocumentsDownloadMetadataParam): Promise<FetchResponse<200, types.JobDocumentsDownloadResponse200>> {
    return this.core.fetch('/{agency_slug}/jobs/{job_id}/documents/{job_document_id}/download', 'get', metadata);
  }

  mergesIndex(metadata: types.MergesIndexMetadataParam): Promise<FetchResponse<200, types.MergesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/merges', 'get', metadata);
  }

  peopleCreate(body: types.PeopleCreateBodyParam, metadata: types.PeopleCreateMetadataParam): Promise<FetchResponse<200, types.PeopleCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/people', 'post', body, metadata);
  }

  peopleIndex(metadata: types.PeopleIndexMetadataParam): Promise<FetchResponse<200, types.PeopleIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/people', 'get', metadata);
  }

  peopleUpdate(body: types.PeopleUpdateBodyParam, metadata: types.PeopleUpdateMetadataParam): Promise<FetchResponse<200, types.PeopleUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{id}', 'put', body, metadata);
  }

  peopleShow(metadata: types.PeopleShowMetadataParam): Promise<FetchResponse<200, types.PeopleShowResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{id}', 'get', metadata);
  }

  person_documentsCreate(body: types.PersonDocumentsCreateBodyParam, metadata: types.PersonDocumentsCreateMetadataParam): Promise<FetchResponse<200, types.PersonDocumentsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/documents', 'post', body, metadata);
  }

  person_documentsDestroy(metadata: types.PersonDocumentsDestroyMetadataParam): Promise<FetchResponse<200, types.PersonDocumentsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/documents/{id}', 'delete', metadata);
  }

  person_documentsDownload(metadata: types.PersonDocumentsDownloadMetadataParam): Promise<FetchResponse<200, types.PersonDocumentsDownloadResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/documents/{person_document_id}/download', 'get', metadata);
  }

  person_education_profilesIndex(metadata: types.PersonEducationProfilesIndexMetadataParam): Promise<FetchResponse<200, types.PersonEducationProfilesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/education_profiles', 'get', metadata);
  }

  person_education_profilesCreate(body: types.PersonEducationProfilesCreateBodyParam, metadata: types.PersonEducationProfilesCreateMetadataParam): Promise<FetchResponse<200, types.PersonEducationProfilesCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/education_profiles', 'post', body, metadata);
  }

  person_education_profilesDestroy(metadata: types.PersonEducationProfilesDestroyMetadataParam): Promise<FetchResponse<200, types.PersonEducationProfilesDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/education_profiles/{id}', 'delete', metadata);
  }

  person_education_profilesShow(metadata: types.PersonEducationProfilesShowMetadataParam): Promise<FetchResponse<200, types.PersonEducationProfilesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/education_profiles/{id}', 'get', metadata);
  }

  person_education_profilesUpdate(body: types.PersonEducationProfilesUpdateBodyParam, metadata: types.PersonEducationProfilesUpdateMetadataParam): Promise<FetchResponse<200, types.PersonEducationProfilesUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/education_profiles/{id}', 'put', body, metadata);
  }

  person_emailsIndex(metadata: types.PersonEmailsIndexMetadataParam): Promise<FetchResponse<200, types.PersonEmailsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/emails', 'get', metadata);
  }

  person_emailsCreate(body: types.PersonEmailsCreateBodyParam, metadata: types.PersonEmailsCreateMetadataParam): Promise<FetchResponse<200, types.PersonEmailsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/emails', 'post', body, metadata);
  }

  person_emailsShow(metadata: types.PersonEmailsShowMetadataParam): Promise<FetchResponse<200, types.PersonEmailsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/emails/{id}', 'get', metadata);
  }

  person_emailsDestroy(metadata: types.PersonEmailsDestroyMetadataParam): Promise<FetchResponse<200, types.PersonEmailsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/emails/{id}', 'delete', metadata);
  }

  person_emailsUpdate(body: types.PersonEmailsUpdateBodyParam, metadata: types.PersonEmailsUpdateMetadataParam): Promise<FetchResponse<200, types.PersonEmailsUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/emails/{id}', 'put', body, metadata);
  }

  person_job_profilesIndex(metadata: types.PersonJobProfilesIndexMetadataParam): Promise<FetchResponse<200, types.PersonJobProfilesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/job_profiles', 'get', metadata);
  }

  person_job_profilesCreate(body: types.PersonJobProfilesCreateBodyParam, metadata: types.PersonJobProfilesCreateMetadataParam): Promise<FetchResponse<200, types.PersonJobProfilesCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/job_profiles', 'post', body, metadata);
  }

  person_job_profilesShow(metadata: types.PersonJobProfilesShowMetadataParam): Promise<FetchResponse<200, types.PersonJobProfilesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/job_profiles/{id}', 'get', metadata);
  }

  person_job_profilesUpdate(body: types.PersonJobProfilesUpdateBodyParam, metadata: types.PersonJobProfilesUpdateMetadataParam): Promise<FetchResponse<200, types.PersonJobProfilesUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/job_profiles/{id}', 'put', body, metadata);
  }

  person_job_profilesDestroy(metadata: types.PersonJobProfilesDestroyMetadataParam): Promise<FetchResponse<200, types.PersonJobProfilesDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/job_profiles/{id}', 'delete', metadata);
  }

  person_list_itemsCreate(body: types.PersonListItemsCreateBodyParam, metadata: types.PersonListItemsCreateMetadataParam): Promise<FetchResponse<200, types.PersonListItemsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/list_items', 'post', body, metadata);
  }

  person_list_itemsIndex(metadata: types.PersonListItemsIndexMetadataParam): Promise<FetchResponse<200, types.PersonListItemsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/list_items', 'get', metadata);
  }

  person_list_itemsShow(metadata: types.PersonListItemsShowMetadataParam): Promise<FetchResponse<200, types.PersonListItemsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/list_items/{id}', 'get', metadata);
  }

  person_list_itemsDestroy(metadata: types.PersonListItemsDestroyMetadataParam): Promise<FetchResponse<200, types.PersonListItemsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/list_items/{id}', 'delete', metadata);
  }

  person_list_itemsUpdate(body: types.PersonListItemsUpdateBodyParam, metadata: types.PersonListItemsUpdateMetadataParam): Promise<FetchResponse<200, types.PersonListItemsUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/list_items/{id}', 'put', body, metadata);
  }

  person_phonesCreate(body: types.PersonPhonesCreateBodyParam, metadata: types.PersonPhonesCreateMetadataParam): Promise<FetchResponse<200, types.PersonPhonesCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/phones', 'post', body, metadata);
  }

  person_phonesIndex(metadata: types.PersonPhonesIndexMetadataParam): Promise<FetchResponse<200, types.PersonPhonesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/phones', 'get', metadata);
  }

  person_phonesDestroy(metadata: types.PersonPhonesDestroyMetadataParam): Promise<FetchResponse<200, types.PersonPhonesDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/phones/{id}', 'delete', metadata);
  }

  person_phonesShow(metadata: types.PersonPhonesShowMetadataParam): Promise<FetchResponse<200, types.PersonPhonesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/phones/{id}', 'get', metadata);
  }

  person_phonesUpdate(body: types.PersonPhonesUpdateBodyParam, metadata: types.PersonPhonesUpdateMetadataParam): Promise<FetchResponse<200, types.PersonPhonesUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/phones/{id}', 'put', body, metadata);
  }

  resumesCreate(body: types.ResumesCreateBodyParam, metadata: types.ResumesCreateMetadataParam): Promise<FetchResponse<200, types.ResumesCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/resumes', 'post', body, metadata);
  }

  resumesDestroy(metadata: types.ResumesDestroyMetadataParam): Promise<FetchResponse<200, types.ResumesDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/resumes/{id}', 'delete', metadata);
  }

  resumesDownload(metadata: types.ResumesDownloadMetadataParam): Promise<FetchResponse<200, types.ResumesDownloadResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/resumes/{resume_id}/download', 'get', metadata);
  }

  peopleShare(body: types.PeopleShareBodyParam, metadata: types.PeopleShareMetadataParam): Promise<FetchResponse<200, types.PeopleShareResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/share', 'post', body, metadata);
  }

  person_sms_opt_insCreate(body: types.PersonSmsOptInsCreateBodyParam, metadata: types.PersonSmsOptInsCreateMetadataParam): Promise<FetchResponse<200, types.PersonSmsOptInsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/sms_opt_ins', 'post', body, metadata);
  }

  person_sms_opt_insIndex(metadata: types.PersonSmsOptInsIndexMetadataParam): Promise<FetchResponse<200, types.PersonSmsOptInsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/sms_opt_ins', 'get', metadata);
  }

  person_sms_opt_insShow(metadata: types.PersonSmsOptInsShowMetadataParam): Promise<FetchResponse<200, types.PersonSmsOptInsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/sms_opt_ins/{id}', 'get', metadata);
  }

  person_social_profilesCreate(body: types.PersonSocialProfilesCreateBodyParam, metadata: types.PersonSocialProfilesCreateMetadataParam): Promise<FetchResponse<200, types.PersonSocialProfilesCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/social_profiles', 'post', body, metadata);
  }

  person_social_profilesIndex(metadata: types.PersonSocialProfilesIndexMetadataParam): Promise<FetchResponse<200, types.PersonSocialProfilesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/social_profiles', 'get', metadata);
  }

  person_social_profilesShow(metadata: types.PersonSocialProfilesShowMetadataParam): Promise<FetchResponse<200, types.PersonSocialProfilesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/social_profiles/{id}', 'get', metadata);
  }

  person_social_profilesDestroy(metadata: types.PersonSocialProfilesDestroyMetadataParam): Promise<FetchResponse<200, types.PersonSocialProfilesDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/social_profiles/{id}', 'delete', metadata);
  }

  person_social_profilesUpdate(body: types.PersonSocialProfilesUpdateBodyParam, metadata: types.PersonSocialProfilesUpdateMetadataParam): Promise<FetchResponse<200, types.PersonSocialProfilesUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/people/{person_id}/social_profiles/{id}', 'put', body, metadata);
  }

  peopleUpdate_by_email(body: types.PeopleUpdateByEmailBodyParam, metadata: types.PeopleUpdateByEmailMetadataParam): Promise<FetchResponse<200, types.PeopleUpdateByEmailResponse200>> {
    return this.core.fetch('/{agency_slug}/people/update_by_email', 'post', body, metadata);
  }

  person_eventsIndex(metadata: types.PersonEventsIndexMetadataParam): Promise<FetchResponse<200, types.PersonEventsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/person_events', 'get', metadata);
  }

  person_eventsCreate(body: types.PersonEventsCreateBodyParam, metadata: types.PersonEventsCreateMetadataParam): Promise<FetchResponse<200, types.PersonEventsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/person_events', 'post', body, metadata);
  }

  person_eventsUpdate(body: types.PersonEventsUpdateBodyParam, metadata: types.PersonEventsUpdateMetadataParam): Promise<FetchResponse<200, types.PersonEventsUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/person_events/{id}', 'put', body, metadata);
  }

  person_eventsShow(metadata: types.PersonEventsShowMetadataParam): Promise<FetchResponse<200, types.PersonEventsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/person_events/{id}', 'get', metadata);
  }

  person_eventsDestroy(metadata: types.PersonEventsDestroyMetadataParam): Promise<FetchResponse<200, types.PersonEventsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/person_events/{id}', 'delete', metadata);
  }

  person_event_documentsCreate(body: types.PersonEventDocumentsCreateBodyParam, metadata: types.PersonEventDocumentsCreateMetadataParam): Promise<FetchResponse<200, types.PersonEventDocumentsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/person_events/{person_event_id}/documents', 'post', body, metadata);
  }

  person_event_documentsDestroy(metadata: types.PersonEventDocumentsDestroyMetadataParam): Promise<FetchResponse<200, types.PersonEventDocumentsDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/person_events/{person_event_id}/documents/{id}', 'delete', metadata);
  }

  person_event_documentsDownload(metadata: types.PersonEventDocumentsDownloadMetadataParam): Promise<FetchResponse<200, types.PersonEventDocumentsDownloadResponse200>> {
    return this.core.fetch('/{agency_slug}/person_events/{person_event_id}/documents/{person_event_document_id}/download', 'get', metadata);
  }

  person_global_statusesIndex(metadata: types.PersonGlobalStatusesIndexMetadataParam): Promise<FetchResponse<200, types.PersonGlobalStatusesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/person_global_statuses', 'get', metadata);
  }

  person_listsIndex(metadata: types.PersonListsIndexMetadataParam): Promise<FetchResponse<200, types.PersonListsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/person_lists', 'get', metadata);
  }

  person_share_field_typesIndex(metadata: types.PersonShareFieldTypesIndexMetadataParam): Promise<FetchResponse<200, types.PersonShareFieldTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/person_share_field_types', 'get', metadata);
  }

  person_typesIndex(metadata: types.PersonTypesIndexMetadataParam): Promise<FetchResponse<200, types.PersonTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/person_types', 'get', metadata);
  }

  phone_typesIndex(metadata: types.PhoneTypesIndexMetadataParam): Promise<FetchResponse<200, types.PhoneTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/phone_types', 'get', metadata);
  }

  placementsIndex(metadata: types.PlacementsIndexMetadataParam): Promise<FetchResponse<200, types.PlacementsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/placements', 'get', metadata);
  }

  placementsShow(metadata: types.PlacementsShowMetadataParam): Promise<FetchResponse<200, types.PlacementsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/placements/{id}', 'get', metadata);
  }

  pronounsIndex(metadata: types.PronounsIndexMetadataParam): Promise<FetchResponse<200, types.PronounsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/pronouns', 'get', metadata);
  }

  question_typesIndex(metadata: types.QuestionTypesIndexMetadataParam): Promise<FetchResponse<200, types.QuestionTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/question_types', 'get', metadata);
  }

  schedule_itemsIndex(metadata: types.ScheduleItemsIndexMetadataParam): Promise<FetchResponse<200, types.ScheduleItemsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/schedule_items', 'get', metadata);
  }

  schedule_itemsShow(metadata: types.ScheduleItemsShowMetadataParam): Promise<FetchResponse<200, types.ScheduleItemsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/schedule_items/{id}', 'get', metadata);
  }

  seniority_levelsIndex(metadata: types.SeniorityLevelsIndexMetadataParam): Promise<FetchResponse<200, types.SeniorityLevelsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/seniority_levels', 'get', metadata);
  }

  smsCreate(body: types.SmsCreateBodyParam, metadata: types.SmsCreateMetadataParam): Promise<FetchResponse<200, types.SmsCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/sms', 'post', body, metadata);
  }

  smsIndex(metadata: types.SmsIndexMetadataParam): Promise<FetchResponse<200, types.SmsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/sms', 'get', metadata);
  }

  smsShow(metadata: types.SmsShowMetadataParam): Promise<FetchResponse<200, types.SmsShowResponse200>> {
    return this.core.fetch('/{agency_slug}/sms/{id}', 'get', metadata);
  }

  social_profile_typesIndex(metadata: types.SocialProfileTypesIndexMetadataParam): Promise<FetchResponse<200, types.SocialProfileTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/social_profile_types', 'get', metadata);
  }

  source_typesCreate(body: types.SourceTypesCreateBodyParam, metadata: types.SourceTypesCreateMetadataParam): Promise<FetchResponse<200, types.SourceTypesCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/source_types', 'post', body, metadata);
  }

  source_typesIndex(metadata: types.SourceTypesIndexMetadataParam): Promise<FetchResponse<200, types.SourceTypesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/source_types', 'get', metadata);
  }

  source_typesDestroy(metadata: types.SourceTypesDestroyMetadataParam): Promise<FetchResponse<200, types.SourceTypesDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/source_types/{id}', 'delete', metadata);
  }

  source_typesUpdate(body: types.SourceTypesUpdateBodyParam, metadata: types.SourceTypesUpdateMetadataParam): Promise<FetchResponse<200, types.SourceTypesUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/source_types/{id}', 'put', body, metadata);
  }

  source_typesShow(metadata: types.SourceTypesShowMetadataParam): Promise<FetchResponse<200, types.SourceTypesShowResponse200>> {
    return this.core.fetch('/{agency_slug}/source_types/{id}', 'get', metadata);
  }

  usersIndex(metadata: types.UsersIndexMetadataParam): Promise<FetchResponse<200, types.UsersIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/users', 'get', metadata);
  }

  veteran_statusesIndex(metadata: types.VeteranStatusesIndexMetadataParam): Promise<FetchResponse<200, types.VeteranStatusesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/veteran_statuses', 'get', metadata);
  }

  webhooksCreate(body: types.WebhooksCreateBodyParam, metadata: types.WebhooksCreateMetadataParam): Promise<FetchResponse<200, types.WebhooksCreateResponse200>> {
    return this.core.fetch('/{agency_slug}/webhooks', 'post', body, metadata);
  }

  webhooksIndex(metadata: types.WebhooksIndexMetadataParam): Promise<FetchResponse<200, types.WebhooksIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/webhooks', 'get', metadata);
  }

  webhooksDestroy(metadata: types.WebhooksDestroyMetadataParam): Promise<FetchResponse<200, types.WebhooksDestroyResponse200>> {
    return this.core.fetch('/{agency_slug}/webhooks/{id}', 'delete', metadata);
  }

  webhooksShow(metadata: types.WebhooksShowMetadataParam): Promise<FetchResponse<200, types.WebhooksShowResponse200>> {
    return this.core.fetch('/{agency_slug}/webhooks/{id}', 'get', metadata);
  }

  webhooksUpdate(body: types.WebhooksUpdateBodyParam, metadata: types.WebhooksUpdateMetadataParam): Promise<FetchResponse<200, types.WebhooksUpdateResponse200>> {
    return this.core.fetch('/{agency_slug}/webhooks/{id}', 'put', body, metadata);
  }

  workflow_stagesIndex(metadata: types.WorkflowStagesIndexMetadataParam): Promise<FetchResponse<200, types.WorkflowStagesIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/workflow_stages', 'get', metadata);
  }

  workflowsIndex(metadata: types.WorkflowsIndexMetadataParam): Promise<FetchResponse<200, types.WorkflowsIndexResponse200>> {
    return this.core.fetch('/{agency_slug}/workflows', 'get', metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { ActivityTypesIndexMetadataParam, ActivityTypesIndexResponse200, AddressTypesIndexMetadataParam, AddressTypesIndexResponse200, BonusPaymentTypesIndexMetadataParam, BonusPaymentTypesIndexResponse200, BonusTypesIndexMetadataParam, BonusTypesIndexResponse200, CandidatesIndexMetadataParam, CandidatesIndexResponse200, CandidatesShowMetadataParam, CandidatesShowResponse200, CandidatesUpdateBodyParam, CandidatesUpdateMetadataParam, CandidatesUpdateResponse200, CitiesIndexMetadataParam, CitiesIndexResponse200, CompaniesCreateBodyParam, CompaniesCreateMetadataParam, CompaniesCreateResponse200, CompaniesIndexMetadataParam, CompaniesIndexResponse200, CompaniesShowMetadataParam, CompaniesShowResponse200, CompaniesUpdateBodyParam, CompaniesUpdateMetadataParam, CompaniesUpdateResponse200, CompanyAddressesCreateBodyParam, CompanyAddressesCreateMetadataParam, CompanyAddressesCreateResponse200, CompanyAddressesDestroyMetadataParam, CompanyAddressesDestroyResponse200, CompanyAddressesIndexMetadataParam, CompanyAddressesIndexResponse200, CompanyAddressesShowMetadataParam, CompanyAddressesShowResponse200, CompanyAddressesUpdateBodyParam, CompanyAddressesUpdateMetadataParam, CompanyAddressesUpdateResponse200, CompanyDocumentsCreateBodyParam, CompanyDocumentsCreateMetadataParam, CompanyDocumentsCreateResponse200, CompanyDocumentsDestroyMetadataParam, CompanyDocumentsDestroyResponse200, CompanyDocumentsDownloadMetadataParam, CompanyDocumentsDownloadResponse200, CompanyEmailsCreateBodyParam, CompanyEmailsCreateMetadataParam, CompanyEmailsCreateResponse200, CompanyEmailsDestroyMetadataParam, CompanyEmailsDestroyResponse200, CompanyEmailsIndexMetadataParam, CompanyEmailsIndexResponse200, CompanyEmailsShowMetadataParam, CompanyEmailsShowResponse200, CompanyEmailsUpdateBodyParam, CompanyEmailsUpdateMetadataParam, CompanyEmailsUpdateResponse200, CompanyGlobalStatusesIndexMetadataParam, CompanyGlobalStatusesIndexResponse200, CompanyPeopleIndexMetadataParam, CompanyPeopleIndexResponse200, CompanyPhonesCreateBodyParam, CompanyPhonesCreateMetadataParam, CompanyPhonesCreateResponse200, CompanyPhonesDestroyMetadataParam, CompanyPhonesDestroyResponse200, CompanyPhonesIndexMetadataParam, CompanyPhonesIndexResponse200, CompanyPhonesShowMetadataParam, CompanyPhonesShowResponse200, CompanyPhonesUpdateBodyParam, CompanyPhonesUpdateMetadataParam, CompanyPhonesUpdateResponse200, CompanyTypesIndexMetadataParam, CompanyTypesIndexResponse200, CompensationTypesIndexMetadataParam, CompensationTypesIndexResponse200, CountriesIndexMetadataParam, CountriesIndexResponse200, CurrenciesIndexMetadataParam, CurrenciesIndexResponse200, DealEventsCreateBodyParam, DealEventsCreateMetadataParam, DealEventsCreateResponse200, DealWorkflowsIndexMetadataParam, DealWorkflowsIndexResponse200, DealWorkflowsShowMetadataParam, DealWorkflowsShowResponse200, DealsCreateBodyParam, DealsCreateMetadataParam, DealsCreateResponse200, DealsIndexMetadataParam, DealsIndexResponse200, DealsShowMetadataParam, DealsShowResponse200, DisabilityStatusesIndexMetadataParam, DisabilityStatusesIndexResponse200, DiversityTypesIndexMetadataParam, DiversityTypesIndexResponse200, DynamicFieldsIndexMetadataParam, DynamicFieldsIndexResponse200, DynamicFieldsShowMetadataParam, DynamicFieldsShowResponse200, EducationTypesIndexMetadataParam, EducationTypesIndexResponse200, EmailTrackingIndexMetadataParam, EmailTrackingIndexResponse200, EmailTypesIndexMetadataParam, EmailTypesIndexResponse200, EquityTypesIndexMetadataParam, EquityTypesIndexResponse200, EthnicitiesIndexMetadataParam, EthnicitiesIndexResponse200, FeeTypesIndexMetadataParam, FeeTypesIndexResponse200, FormTemplatesIndexMetadataParam, FormTemplatesIndexResponse200, FormTemplatesShowMetadataParam, FormTemplatesShowResponse200, FormsCreateBodyParam, FormsCreateMetadataParam, FormsCreateResponse200, FormsDestroyMetadataParam, FormsDestroyResponse200, FormsIndexMetadataParam, FormsIndexResponse200, FormsShowMetadataParam, FormsShowResponse200, FormsUpdateBodyParam, FormsUpdateMetadataParam, FormsUpdateResponse200, GendersIndexMetadataParam, GendersIndexResponse200, HierarchiesCreateBodyParam, HierarchiesCreateMetadataParam, HierarchiesCreateResponse200, HierarchiesDestroyMetadataParam, HierarchiesDestroyResponse200, HierarchiesIndexMetadataParam, HierarchiesIndexResponse200, HierarchiesShowMetadataParam, HierarchiesShowResponse200, HierarchiesUpdateBodyParam, HierarchiesUpdateMetadataParam, HierarchiesUpdateResponse200, JobCategoriesIndexMetadataParam, JobCategoriesIndexResponse200, JobContactTypesIndexMetadataParam, JobContactTypesIndexResponse200, JobContactsCreateBodyParam, JobContactsCreateMetadataParam, JobContactsCreateResponse200, JobContactsDestroyMetadataParam, JobContactsDestroyResponse200, JobContactsIndexMetadataParam, JobContactsIndexResponse200, JobContactsUpdateBodyParam, JobContactsUpdateMetadataParam, JobContactsUpdateResponse200, JobDocumentsCreateBodyParam, JobDocumentsCreateMetadataParam, JobDocumentsCreateResponse200, JobDocumentsDestroyMetadataParam, JobDocumentsDestroyResponse200, JobDocumentsDownloadMetadataParam, JobDocumentsDownloadResponse200, JobListingConfigIndexMetadataParam, JobListingConfigIndexResponse200, JobOwnerTypesIndexMetadataParam, JobOwnerTypesIndexResponse200, JobStatusesIndexMetadataParam, JobStatusesIndexResponse200, JobTypesIndexMetadataParam, JobTypesIndexResponse200, JobsApplyBodyParam, JobsApplyMetadataParam, JobsApplyResponse200, JobsCreateBodyParam, JobsCreateMetadataParam, JobsCreateResponse200, JobsDestroyMetadataParam, JobsDestroyResponse200, JobsIndexMetadataParam, JobsIndexResponse200, JobsShowMetadataParam, JobsShowResponse200, JobsUpdateBodyParam, JobsUpdateMetadataParam, JobsUpdateResponse200, MergesIndexMetadataParam, MergesIndexResponse200, PeopleCreateBodyParam, PeopleCreateMetadataParam, PeopleCreateResponse200, PeopleIndexMetadataParam, PeopleIndexResponse200, PeopleShareBodyParam, PeopleShareMetadataParam, PeopleShareResponse200, PeopleShowMetadataParam, PeopleShowResponse200, PeopleUpdateBodyParam, PeopleUpdateByEmailBodyParam, PeopleUpdateByEmailMetadataParam, PeopleUpdateByEmailResponse200, PeopleUpdateMetadataParam, PeopleUpdateResponse200, PersonDocumentsCreateBodyParam, PersonDocumentsCreateMetadataParam, PersonDocumentsCreateResponse200, PersonDocumentsDestroyMetadataParam, PersonDocumentsDestroyResponse200, PersonDocumentsDownloadMetadataParam, PersonDocumentsDownloadResponse200, PersonEducationProfilesCreateBodyParam, PersonEducationProfilesCreateMetadataParam, PersonEducationProfilesCreateResponse200, PersonEducationProfilesDestroyMetadataParam, PersonEducationProfilesDestroyResponse200, PersonEducationProfilesIndexMetadataParam, PersonEducationProfilesIndexResponse200, PersonEducationProfilesShowMetadataParam, PersonEducationProfilesShowResponse200, PersonEducationProfilesUpdateBodyParam, PersonEducationProfilesUpdateMetadataParam, PersonEducationProfilesUpdateResponse200, PersonEmailsCreateBodyParam, PersonEmailsCreateMetadataParam, PersonEmailsCreateResponse200, PersonEmailsDestroyMetadataParam, PersonEmailsDestroyResponse200, PersonEmailsIndexMetadataParam, PersonEmailsIndexResponse200, PersonEmailsShowMetadataParam, PersonEmailsShowResponse200, PersonEmailsUpdateBodyParam, PersonEmailsUpdateMetadataParam, PersonEmailsUpdateResponse200, PersonEventDocumentsCreateBodyParam, PersonEventDocumentsCreateMetadataParam, PersonEventDocumentsCreateResponse200, PersonEventDocumentsDestroyMetadataParam, PersonEventDocumentsDestroyResponse200, PersonEventDocumentsDownloadMetadataParam, PersonEventDocumentsDownloadResponse200, PersonEventsCreateBodyParam, PersonEventsCreateMetadataParam, PersonEventsCreateResponse200, PersonEventsDestroyMetadataParam, PersonEventsDestroyResponse200, PersonEventsIndexMetadataParam, PersonEventsIndexResponse200, PersonEventsShowMetadataParam, PersonEventsShowResponse200, PersonEventsUpdateBodyParam, PersonEventsUpdateMetadataParam, PersonEventsUpdateResponse200, PersonGlobalStatusesIndexMetadataParam, PersonGlobalStatusesIndexResponse200, PersonJobProfilesCreateBodyParam, PersonJobProfilesCreateMetadataParam, PersonJobProfilesCreateResponse200, PersonJobProfilesDestroyMetadataParam, PersonJobProfilesDestroyResponse200, PersonJobProfilesIndexMetadataParam, PersonJobProfilesIndexResponse200, PersonJobProfilesShowMetadataParam, PersonJobProfilesShowResponse200, PersonJobProfilesUpdateBodyParam, PersonJobProfilesUpdateMetadataParam, PersonJobProfilesUpdateResponse200, PersonListItemsCreateBodyParam, PersonListItemsCreateMetadataParam, PersonListItemsCreateResponse200, PersonListItemsDestroyMetadataParam, PersonListItemsDestroyResponse200, PersonListItemsIndexMetadataParam, PersonListItemsIndexResponse200, PersonListItemsShowMetadataParam, PersonListItemsShowResponse200, PersonListItemsUpdateBodyParam, PersonListItemsUpdateMetadataParam, PersonListItemsUpdateResponse200, PersonListsIndexMetadataParam, PersonListsIndexResponse200, PersonPhonesCreateBodyParam, PersonPhonesCreateMetadataParam, PersonPhonesCreateResponse200, PersonPhonesDestroyMetadataParam, PersonPhonesDestroyResponse200, PersonPhonesIndexMetadataParam, PersonPhonesIndexResponse200, PersonPhonesShowMetadataParam, PersonPhonesShowResponse200, PersonPhonesUpdateBodyParam, PersonPhonesUpdateMetadataParam, PersonPhonesUpdateResponse200, PersonShareFieldTypesIndexMetadataParam, PersonShareFieldTypesIndexResponse200, PersonSmsOptInsCreateBodyParam, PersonSmsOptInsCreateMetadataParam, PersonSmsOptInsCreateResponse200, PersonSmsOptInsIndexMetadataParam, PersonSmsOptInsIndexResponse200, PersonSmsOptInsShowMetadataParam, PersonSmsOptInsShowResponse200, PersonSocialProfilesCreateBodyParam, PersonSocialProfilesCreateMetadataParam, PersonSocialProfilesCreateResponse200, PersonSocialProfilesDestroyMetadataParam, PersonSocialProfilesDestroyResponse200, PersonSocialProfilesIndexMetadataParam, PersonSocialProfilesIndexResponse200, PersonSocialProfilesShowMetadataParam, PersonSocialProfilesShowResponse200, PersonSocialProfilesUpdateBodyParam, PersonSocialProfilesUpdateMetadataParam, PersonSocialProfilesUpdateResponse200, PersonTypesIndexMetadataParam, PersonTypesIndexResponse200, PhoneTypesIndexMetadataParam, PhoneTypesIndexResponse200, PlacementsIndexMetadataParam, PlacementsIndexResponse200, PlacementsShowMetadataParam, PlacementsShowResponse200, PronounsIndexMetadataParam, PronounsIndexResponse200, QuestionTypesIndexMetadataParam, QuestionTypesIndexResponse200, ResumesCreateBodyParam, ResumesCreateMetadataParam, ResumesCreateResponse200, ResumesDestroyMetadataParam, ResumesDestroyResponse200, ResumesDownloadMetadataParam, ResumesDownloadResponse200, ScheduleItemsIndexMetadataParam, ScheduleItemsIndexResponse200, ScheduleItemsShowMetadataParam, ScheduleItemsShowResponse200, SeniorityLevelsIndexMetadataParam, SeniorityLevelsIndexResponse200, SmsCreateBodyParam, SmsCreateMetadataParam, SmsCreateResponse200, SmsIndexMetadataParam, SmsIndexResponse200, SmsShowMetadataParam, SmsShowResponse200, SocialProfileTypesIndexMetadataParam, SocialProfileTypesIndexResponse200, SourceTypesCreateBodyParam, SourceTypesCreateMetadataParam, SourceTypesCreateResponse200, SourceTypesDestroyMetadataParam, SourceTypesDestroyResponse200, SourceTypesIndexMetadataParam, SourceTypesIndexResponse200, SourceTypesShowMetadataParam, SourceTypesShowResponse200, SourceTypesUpdateBodyParam, SourceTypesUpdateMetadataParam, SourceTypesUpdateResponse200, StatesIndexMetadataParam, StatesIndexResponse200, UsersIndexMetadataParam, UsersIndexResponse200, VeteranStatusesIndexMetadataParam, VeteranStatusesIndexResponse200, WebhooksCreateBodyParam, WebhooksCreateMetadataParam, WebhooksCreateResponse200, WebhooksDestroyMetadataParam, WebhooksDestroyResponse200, WebhooksIndexMetadataParam, WebhooksIndexResponse200, WebhooksShowMetadataParam, WebhooksShowResponse200, WebhooksUpdateBodyParam, WebhooksUpdateMetadataParam, WebhooksUpdateResponse200, WorkflowStagesIndexMetadataParam, WorkflowStagesIndexResponse200, WorkflowsIndexMetadataParam, WorkflowsIndexResponse200 } from './types';
