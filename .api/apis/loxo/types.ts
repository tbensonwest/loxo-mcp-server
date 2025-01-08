import type { FromSchema } from 'json-schema-to-ts';
import * as schemas from './schemas';

export type ActivityTypesIndexMetadataParam = FromSchema<typeof schemas.ActivityTypesIndex.metadata>;
export type ActivityTypesIndexResponse200 = FromSchema<typeof schemas.ActivityTypesIndex.response['200']>;
export type AddressTypesIndexMetadataParam = FromSchema<typeof schemas.AddressTypesIndex.metadata>;
export type AddressTypesIndexResponse200 = FromSchema<typeof schemas.AddressTypesIndex.response['200']>;
export type BonusPaymentTypesIndexMetadataParam = FromSchema<typeof schemas.BonusPaymentTypesIndex.metadata>;
export type BonusPaymentTypesIndexResponse200 = FromSchema<typeof schemas.BonusPaymentTypesIndex.response['200']>;
export type BonusTypesIndexMetadataParam = FromSchema<typeof schemas.BonusTypesIndex.metadata>;
export type BonusTypesIndexResponse200 = FromSchema<typeof schemas.BonusTypesIndex.response['200']>;
export type CandidatesIndexMetadataParam = FromSchema<typeof schemas.CandidatesIndex.metadata>;
export type CandidatesIndexResponse200 = FromSchema<typeof schemas.CandidatesIndex.response['200']>;
export type CandidatesShowMetadataParam = FromSchema<typeof schemas.CandidatesShow.metadata>;
export type CandidatesShowResponse200 = FromSchema<typeof schemas.CandidatesShow.response['200']>;
export type CandidatesUpdateBodyParam = FromSchema<typeof schemas.CandidatesUpdate.body>;
export type CandidatesUpdateMetadataParam = FromSchema<typeof schemas.CandidatesUpdate.metadata>;
export type CandidatesUpdateResponse200 = FromSchema<typeof schemas.CandidatesUpdate.response['200']>;
export type CitiesIndexMetadataParam = FromSchema<typeof schemas.CitiesIndex.metadata>;
export type CitiesIndexResponse200 = FromSchema<typeof schemas.CitiesIndex.response['200']>;
export type CompaniesCreateBodyParam = FromSchema<typeof schemas.CompaniesCreate.body>;
export type CompaniesCreateMetadataParam = FromSchema<typeof schemas.CompaniesCreate.metadata>;
export type CompaniesCreateResponse200 = FromSchema<typeof schemas.CompaniesCreate.response['200']>;
export type CompaniesIndexMetadataParam = FromSchema<typeof schemas.CompaniesIndex.metadata>;
export type CompaniesIndexResponse200 = FromSchema<typeof schemas.CompaniesIndex.response['200']>;
export type CompaniesShowMetadataParam = FromSchema<typeof schemas.CompaniesShow.metadata>;
export type CompaniesShowResponse200 = FromSchema<typeof schemas.CompaniesShow.response['200']>;
export type CompaniesUpdateBodyParam = FromSchema<typeof schemas.CompaniesUpdate.body>;
export type CompaniesUpdateMetadataParam = FromSchema<typeof schemas.CompaniesUpdate.metadata>;
export type CompaniesUpdateResponse200 = FromSchema<typeof schemas.CompaniesUpdate.response['200']>;
export type CompanyAddressesCreateBodyParam = FromSchema<typeof schemas.CompanyAddressesCreate.body>;
export type CompanyAddressesCreateMetadataParam = FromSchema<typeof schemas.CompanyAddressesCreate.metadata>;
export type CompanyAddressesCreateResponse200 = FromSchema<typeof schemas.CompanyAddressesCreate.response['200']>;
export type CompanyAddressesDestroyMetadataParam = FromSchema<typeof schemas.CompanyAddressesDestroy.metadata>;
export type CompanyAddressesDestroyResponse200 = FromSchema<typeof schemas.CompanyAddressesDestroy.response['200']>;
export type CompanyAddressesIndexMetadataParam = FromSchema<typeof schemas.CompanyAddressesIndex.metadata>;
export type CompanyAddressesIndexResponse200 = FromSchema<typeof schemas.CompanyAddressesIndex.response['200']>;
export type CompanyAddressesShowMetadataParam = FromSchema<typeof schemas.CompanyAddressesShow.metadata>;
export type CompanyAddressesShowResponse200 = FromSchema<typeof schemas.CompanyAddressesShow.response['200']>;
export type CompanyAddressesUpdateBodyParam = FromSchema<typeof schemas.CompanyAddressesUpdate.body>;
export type CompanyAddressesUpdateMetadataParam = FromSchema<typeof schemas.CompanyAddressesUpdate.metadata>;
export type CompanyAddressesUpdateResponse200 = FromSchema<typeof schemas.CompanyAddressesUpdate.response['200']>;
export type CompanyDocumentsCreateBodyParam = FromSchema<typeof schemas.CompanyDocumentsCreate.body>;
export type CompanyDocumentsCreateMetadataParam = FromSchema<typeof schemas.CompanyDocumentsCreate.metadata>;
export type CompanyDocumentsCreateResponse200 = FromSchema<typeof schemas.CompanyDocumentsCreate.response['200']>;
export type CompanyDocumentsDestroyMetadataParam = FromSchema<typeof schemas.CompanyDocumentsDestroy.metadata>;
export type CompanyDocumentsDestroyResponse200 = FromSchema<typeof schemas.CompanyDocumentsDestroy.response['200']>;
export type CompanyDocumentsDownloadMetadataParam = FromSchema<typeof schemas.CompanyDocumentsDownload.metadata>;
export type CompanyDocumentsDownloadResponse200 = FromSchema<typeof schemas.CompanyDocumentsDownload.response['200']>;
export type CompanyEmailsCreateBodyParam = FromSchema<typeof schemas.CompanyEmailsCreate.body>;
export type CompanyEmailsCreateMetadataParam = FromSchema<typeof schemas.CompanyEmailsCreate.metadata>;
export type CompanyEmailsCreateResponse200 = FromSchema<typeof schemas.CompanyEmailsCreate.response['200']>;
export type CompanyEmailsDestroyMetadataParam = FromSchema<typeof schemas.CompanyEmailsDestroy.metadata>;
export type CompanyEmailsDestroyResponse200 = FromSchema<typeof schemas.CompanyEmailsDestroy.response['200']>;
export type CompanyEmailsIndexMetadataParam = FromSchema<typeof schemas.CompanyEmailsIndex.metadata>;
export type CompanyEmailsIndexResponse200 = FromSchema<typeof schemas.CompanyEmailsIndex.response['200']>;
export type CompanyEmailsShowMetadataParam = FromSchema<typeof schemas.CompanyEmailsShow.metadata>;
export type CompanyEmailsShowResponse200 = FromSchema<typeof schemas.CompanyEmailsShow.response['200']>;
export type CompanyEmailsUpdateBodyParam = FromSchema<typeof schemas.CompanyEmailsUpdate.body>;
export type CompanyEmailsUpdateMetadataParam = FromSchema<typeof schemas.CompanyEmailsUpdate.metadata>;
export type CompanyEmailsUpdateResponse200 = FromSchema<typeof schemas.CompanyEmailsUpdate.response['200']>;
export type CompanyGlobalStatusesIndexMetadataParam = FromSchema<typeof schemas.CompanyGlobalStatusesIndex.metadata>;
export type CompanyGlobalStatusesIndexResponse200 = FromSchema<typeof schemas.CompanyGlobalStatusesIndex.response['200']>;
export type CompanyPeopleIndexMetadataParam = FromSchema<typeof schemas.CompanyPeopleIndex.metadata>;
export type CompanyPeopleIndexResponse200 = FromSchema<typeof schemas.CompanyPeopleIndex.response['200']>;
export type CompanyPhonesCreateBodyParam = FromSchema<typeof schemas.CompanyPhonesCreate.body>;
export type CompanyPhonesCreateMetadataParam = FromSchema<typeof schemas.CompanyPhonesCreate.metadata>;
export type CompanyPhonesCreateResponse200 = FromSchema<typeof schemas.CompanyPhonesCreate.response['200']>;
export type CompanyPhonesDestroyMetadataParam = FromSchema<typeof schemas.CompanyPhonesDestroy.metadata>;
export type CompanyPhonesDestroyResponse200 = FromSchema<typeof schemas.CompanyPhonesDestroy.response['200']>;
export type CompanyPhonesIndexMetadataParam = FromSchema<typeof schemas.CompanyPhonesIndex.metadata>;
export type CompanyPhonesIndexResponse200 = FromSchema<typeof schemas.CompanyPhonesIndex.response['200']>;
export type CompanyPhonesShowMetadataParam = FromSchema<typeof schemas.CompanyPhonesShow.metadata>;
export type CompanyPhonesShowResponse200 = FromSchema<typeof schemas.CompanyPhonesShow.response['200']>;
export type CompanyPhonesUpdateBodyParam = FromSchema<typeof schemas.CompanyPhonesUpdate.body>;
export type CompanyPhonesUpdateMetadataParam = FromSchema<typeof schemas.CompanyPhonesUpdate.metadata>;
export type CompanyPhonesUpdateResponse200 = FromSchema<typeof schemas.CompanyPhonesUpdate.response['200']>;
export type CompanyTypesIndexMetadataParam = FromSchema<typeof schemas.CompanyTypesIndex.metadata>;
export type CompanyTypesIndexResponse200 = FromSchema<typeof schemas.CompanyTypesIndex.response['200']>;
export type CompensationTypesIndexMetadataParam = FromSchema<typeof schemas.CompensationTypesIndex.metadata>;
export type CompensationTypesIndexResponse200 = FromSchema<typeof schemas.CompensationTypesIndex.response['200']>;
export type CountriesIndexMetadataParam = FromSchema<typeof schemas.CountriesIndex.metadata>;
export type CountriesIndexResponse200 = FromSchema<typeof schemas.CountriesIndex.response['200']>;
export type CurrenciesIndexMetadataParam = FromSchema<typeof schemas.CurrenciesIndex.metadata>;
export type CurrenciesIndexResponse200 = FromSchema<typeof schemas.CurrenciesIndex.response['200']>;
export type DealEventsCreateBodyParam = FromSchema<typeof schemas.DealEventsCreate.body>;
export type DealEventsCreateMetadataParam = FromSchema<typeof schemas.DealEventsCreate.metadata>;
export type DealEventsCreateResponse200 = FromSchema<typeof schemas.DealEventsCreate.response['200']>;
export type DealWorkflowsIndexMetadataParam = FromSchema<typeof schemas.DealWorkflowsIndex.metadata>;
export type DealWorkflowsIndexResponse200 = FromSchema<typeof schemas.DealWorkflowsIndex.response['200']>;
export type DealWorkflowsShowMetadataParam = FromSchema<typeof schemas.DealWorkflowsShow.metadata>;
export type DealWorkflowsShowResponse200 = FromSchema<typeof schemas.DealWorkflowsShow.response['200']>;
export type DealsCreateBodyParam = FromSchema<typeof schemas.DealsCreate.body>;
export type DealsCreateMetadataParam = FromSchema<typeof schemas.DealsCreate.metadata>;
export type DealsCreateResponse200 = FromSchema<typeof schemas.DealsCreate.response['200']>;
export type DealsIndexMetadataParam = FromSchema<typeof schemas.DealsIndex.metadata>;
export type DealsIndexResponse200 = FromSchema<typeof schemas.DealsIndex.response['200']>;
export type DealsShowMetadataParam = FromSchema<typeof schemas.DealsShow.metadata>;
export type DealsShowResponse200 = FromSchema<typeof schemas.DealsShow.response['200']>;
export type DisabilityStatusesIndexMetadataParam = FromSchema<typeof schemas.DisabilityStatusesIndex.metadata>;
export type DisabilityStatusesIndexResponse200 = FromSchema<typeof schemas.DisabilityStatusesIndex.response['200']>;
export type DiversityTypesIndexMetadataParam = FromSchema<typeof schemas.DiversityTypesIndex.metadata>;
export type DiversityTypesIndexResponse200 = FromSchema<typeof schemas.DiversityTypesIndex.response['200']>;
export type DynamicFieldsIndexMetadataParam = FromSchema<typeof schemas.DynamicFieldsIndex.metadata>;
export type DynamicFieldsIndexResponse200 = FromSchema<typeof schemas.DynamicFieldsIndex.response['200']>;
export type DynamicFieldsShowMetadataParam = FromSchema<typeof schemas.DynamicFieldsShow.metadata>;
export type DynamicFieldsShowResponse200 = FromSchema<typeof schemas.DynamicFieldsShow.response['200']>;
export type EducationTypesIndexMetadataParam = FromSchema<typeof schemas.EducationTypesIndex.metadata>;
export type EducationTypesIndexResponse200 = FromSchema<typeof schemas.EducationTypesIndex.response['200']>;
export type EmailTrackingIndexMetadataParam = FromSchema<typeof schemas.EmailTrackingIndex.metadata>;
export type EmailTrackingIndexResponse200 = FromSchema<typeof schemas.EmailTrackingIndex.response['200']>;
export type EmailTypesIndexMetadataParam = FromSchema<typeof schemas.EmailTypesIndex.metadata>;
export type EmailTypesIndexResponse200 = FromSchema<typeof schemas.EmailTypesIndex.response['200']>;
export type EquityTypesIndexMetadataParam = FromSchema<typeof schemas.EquityTypesIndex.metadata>;
export type EquityTypesIndexResponse200 = FromSchema<typeof schemas.EquityTypesIndex.response['200']>;
export type EthnicitiesIndexMetadataParam = FromSchema<typeof schemas.EthnicitiesIndex.metadata>;
export type EthnicitiesIndexResponse200 = FromSchema<typeof schemas.EthnicitiesIndex.response['200']>;
export type FeeTypesIndexMetadataParam = FromSchema<typeof schemas.FeeTypesIndex.metadata>;
export type FeeTypesIndexResponse200 = FromSchema<typeof schemas.FeeTypesIndex.response['200']>;
export type FormTemplatesIndexMetadataParam = FromSchema<typeof schemas.FormTemplatesIndex.metadata>;
export type FormTemplatesIndexResponse200 = FromSchema<typeof schemas.FormTemplatesIndex.response['200']>;
export type FormTemplatesShowMetadataParam = FromSchema<typeof schemas.FormTemplatesShow.metadata>;
export type FormTemplatesShowResponse200 = FromSchema<typeof schemas.FormTemplatesShow.response['200']>;
export type FormsCreateBodyParam = FromSchema<typeof schemas.FormsCreate.body>;
export type FormsCreateMetadataParam = FromSchema<typeof schemas.FormsCreate.metadata>;
export type FormsCreateResponse200 = FromSchema<typeof schemas.FormsCreate.response['200']>;
export type FormsDestroyMetadataParam = FromSchema<typeof schemas.FormsDestroy.metadata>;
export type FormsDestroyResponse200 = FromSchema<typeof schemas.FormsDestroy.response['200']>;
export type FormsIndexMetadataParam = FromSchema<typeof schemas.FormsIndex.metadata>;
export type FormsIndexResponse200 = FromSchema<typeof schemas.FormsIndex.response['200']>;
export type FormsShowMetadataParam = FromSchema<typeof schemas.FormsShow.metadata>;
export type FormsShowResponse200 = FromSchema<typeof schemas.FormsShow.response['200']>;
export type FormsUpdateBodyParam = FromSchema<typeof schemas.FormsUpdate.body>;
export type FormsUpdateMetadataParam = FromSchema<typeof schemas.FormsUpdate.metadata>;
export type FormsUpdateResponse200 = FromSchema<typeof schemas.FormsUpdate.response['200']>;
export type GendersIndexMetadataParam = FromSchema<typeof schemas.GendersIndex.metadata>;
export type GendersIndexResponse200 = FromSchema<typeof schemas.GendersIndex.response['200']>;
export type HierarchiesCreateBodyParam = FromSchema<typeof schemas.HierarchiesCreate.body>;
export type HierarchiesCreateMetadataParam = FromSchema<typeof schemas.HierarchiesCreate.metadata>;
export type HierarchiesCreateResponse200 = FromSchema<typeof schemas.HierarchiesCreate.response['200']>;
export type HierarchiesDestroyMetadataParam = FromSchema<typeof schemas.HierarchiesDestroy.metadata>;
export type HierarchiesDestroyResponse200 = FromSchema<typeof schemas.HierarchiesDestroy.response['200']>;
export type HierarchiesIndexMetadataParam = FromSchema<typeof schemas.HierarchiesIndex.metadata>;
export type HierarchiesIndexResponse200 = FromSchema<typeof schemas.HierarchiesIndex.response['200']>;
export type HierarchiesShowMetadataParam = FromSchema<typeof schemas.HierarchiesShow.metadata>;
export type HierarchiesShowResponse200 = FromSchema<typeof schemas.HierarchiesShow.response['200']>;
export type HierarchiesUpdateBodyParam = FromSchema<typeof schemas.HierarchiesUpdate.body>;
export type HierarchiesUpdateMetadataParam = FromSchema<typeof schemas.HierarchiesUpdate.metadata>;
export type HierarchiesUpdateResponse200 = FromSchema<typeof schemas.HierarchiesUpdate.response['200']>;
export type JobCategoriesIndexMetadataParam = FromSchema<typeof schemas.JobCategoriesIndex.metadata>;
export type JobCategoriesIndexResponse200 = FromSchema<typeof schemas.JobCategoriesIndex.response['200']>;
export type JobContactTypesIndexMetadataParam = FromSchema<typeof schemas.JobContactTypesIndex.metadata>;
export type JobContactTypesIndexResponse200 = FromSchema<typeof schemas.JobContactTypesIndex.response['200']>;
export type JobContactsCreateBodyParam = FromSchema<typeof schemas.JobContactsCreate.body>;
export type JobContactsCreateMetadataParam = FromSchema<typeof schemas.JobContactsCreate.metadata>;
export type JobContactsCreateResponse200 = FromSchema<typeof schemas.JobContactsCreate.response['200']>;
export type JobContactsDestroyMetadataParam = FromSchema<typeof schemas.JobContactsDestroy.metadata>;
export type JobContactsDestroyResponse200 = FromSchema<typeof schemas.JobContactsDestroy.response['200']>;
export type JobContactsIndexMetadataParam = FromSchema<typeof schemas.JobContactsIndex.metadata>;
export type JobContactsIndexResponse200 = FromSchema<typeof schemas.JobContactsIndex.response['200']>;
export type JobContactsUpdateBodyParam = FromSchema<typeof schemas.JobContactsUpdate.body>;
export type JobContactsUpdateMetadataParam = FromSchema<typeof schemas.JobContactsUpdate.metadata>;
export type JobContactsUpdateResponse200 = FromSchema<typeof schemas.JobContactsUpdate.response['200']>;
export type JobDocumentsCreateBodyParam = FromSchema<typeof schemas.JobDocumentsCreate.body>;
export type JobDocumentsCreateMetadataParam = FromSchema<typeof schemas.JobDocumentsCreate.metadata>;
export type JobDocumentsCreateResponse200 = FromSchema<typeof schemas.JobDocumentsCreate.response['200']>;
export type JobDocumentsDestroyMetadataParam = FromSchema<typeof schemas.JobDocumentsDestroy.metadata>;
export type JobDocumentsDestroyResponse200 = FromSchema<typeof schemas.JobDocumentsDestroy.response['200']>;
export type JobDocumentsDownloadMetadataParam = FromSchema<typeof schemas.JobDocumentsDownload.metadata>;
export type JobDocumentsDownloadResponse200 = FromSchema<typeof schemas.JobDocumentsDownload.response['200']>;
export type JobListingConfigIndexMetadataParam = FromSchema<typeof schemas.JobListingConfigIndex.metadata>;
export type JobListingConfigIndexResponse200 = FromSchema<typeof schemas.JobListingConfigIndex.response['200']>;
export type JobOwnerTypesIndexMetadataParam = FromSchema<typeof schemas.JobOwnerTypesIndex.metadata>;
export type JobOwnerTypesIndexResponse200 = FromSchema<typeof schemas.JobOwnerTypesIndex.response['200']>;
export type JobStatusesIndexMetadataParam = FromSchema<typeof schemas.JobStatusesIndex.metadata>;
export type JobStatusesIndexResponse200 = FromSchema<typeof schemas.JobStatusesIndex.response['200']>;
export type JobTypesIndexMetadataParam = FromSchema<typeof schemas.JobTypesIndex.metadata>;
export type JobTypesIndexResponse200 = FromSchema<typeof schemas.JobTypesIndex.response['200']>;
export type JobsApplyBodyParam = FromSchema<typeof schemas.JobsApply.body>;
export type JobsApplyMetadataParam = FromSchema<typeof schemas.JobsApply.metadata>;
export type JobsApplyResponse200 = FromSchema<typeof schemas.JobsApply.response['200']>;
export type JobsCreateBodyParam = FromSchema<typeof schemas.JobsCreate.body>;
export type JobsCreateMetadataParam = FromSchema<typeof schemas.JobsCreate.metadata>;
export type JobsCreateResponse200 = FromSchema<typeof schemas.JobsCreate.response['200']>;
export type JobsDestroyMetadataParam = FromSchema<typeof schemas.JobsDestroy.metadata>;
export type JobsDestroyResponse200 = FromSchema<typeof schemas.JobsDestroy.response['200']>;
export type JobsIndexMetadataParam = FromSchema<typeof schemas.JobsIndex.metadata>;
export type JobsIndexResponse200 = FromSchema<typeof schemas.JobsIndex.response['200']>;
export type JobsShowMetadataParam = FromSchema<typeof schemas.JobsShow.metadata>;
export type JobsShowResponse200 = FromSchema<typeof schemas.JobsShow.response['200']>;
export type JobsUpdateBodyParam = FromSchema<typeof schemas.JobsUpdate.body>;
export type JobsUpdateMetadataParam = FromSchema<typeof schemas.JobsUpdate.metadata>;
export type JobsUpdateResponse200 = FromSchema<typeof schemas.JobsUpdate.response['200']>;
export type MergesIndexMetadataParam = FromSchema<typeof schemas.MergesIndex.metadata>;
export type MergesIndexResponse200 = FromSchema<typeof schemas.MergesIndex.response['200']>;
export type PeopleCreateBodyParam = FromSchema<typeof schemas.PeopleCreate.body>;
export type PeopleCreateMetadataParam = FromSchema<typeof schemas.PeopleCreate.metadata>;
export type PeopleCreateResponse200 = FromSchema<typeof schemas.PeopleCreate.response['200']>;
export type PeopleIndexMetadataParam = FromSchema<typeof schemas.PeopleIndex.metadata>;
export type PeopleIndexResponse200 = FromSchema<typeof schemas.PeopleIndex.response['200']>;
export type PeopleShareBodyParam = FromSchema<typeof schemas.PeopleShare.body>;
export type PeopleShareMetadataParam = FromSchema<typeof schemas.PeopleShare.metadata>;
export type PeopleShareResponse200 = FromSchema<typeof schemas.PeopleShare.response['200']>;
export type PeopleShowMetadataParam = FromSchema<typeof schemas.PeopleShow.metadata>;
export type PeopleShowResponse200 = FromSchema<typeof schemas.PeopleShow.response['200']>;
export type PeopleUpdateBodyParam = FromSchema<typeof schemas.PeopleUpdate.body>;
export type PeopleUpdateByEmailBodyParam = FromSchema<typeof schemas.PeopleUpdateByEmail.body>;
export type PeopleUpdateByEmailMetadataParam = FromSchema<typeof schemas.PeopleUpdateByEmail.metadata>;
export type PeopleUpdateByEmailResponse200 = FromSchema<typeof schemas.PeopleUpdateByEmail.response['200']>;
export type PeopleUpdateMetadataParam = FromSchema<typeof schemas.PeopleUpdate.metadata>;
export type PeopleUpdateResponse200 = FromSchema<typeof schemas.PeopleUpdate.response['200']>;
export type PersonDocumentsCreateBodyParam = FromSchema<typeof schemas.PersonDocumentsCreate.body>;
export type PersonDocumentsCreateMetadataParam = FromSchema<typeof schemas.PersonDocumentsCreate.metadata>;
export type PersonDocumentsCreateResponse200 = FromSchema<typeof schemas.PersonDocumentsCreate.response['200']>;
export type PersonDocumentsDestroyMetadataParam = FromSchema<typeof schemas.PersonDocumentsDestroy.metadata>;
export type PersonDocumentsDestroyResponse200 = FromSchema<typeof schemas.PersonDocumentsDestroy.response['200']>;
export type PersonDocumentsDownloadMetadataParam = FromSchema<typeof schemas.PersonDocumentsDownload.metadata>;
export type PersonDocumentsDownloadResponse200 = FromSchema<typeof schemas.PersonDocumentsDownload.response['200']>;
export type PersonEducationProfilesCreateBodyParam = FromSchema<typeof schemas.PersonEducationProfilesCreate.body>;
export type PersonEducationProfilesCreateMetadataParam = FromSchema<typeof schemas.PersonEducationProfilesCreate.metadata>;
export type PersonEducationProfilesCreateResponse200 = FromSchema<typeof schemas.PersonEducationProfilesCreate.response['200']>;
export type PersonEducationProfilesDestroyMetadataParam = FromSchema<typeof schemas.PersonEducationProfilesDestroy.metadata>;
export type PersonEducationProfilesDestroyResponse200 = FromSchema<typeof schemas.PersonEducationProfilesDestroy.response['200']>;
export type PersonEducationProfilesIndexMetadataParam = FromSchema<typeof schemas.PersonEducationProfilesIndex.metadata>;
export type PersonEducationProfilesIndexResponse200 = FromSchema<typeof schemas.PersonEducationProfilesIndex.response['200']>;
export type PersonEducationProfilesShowMetadataParam = FromSchema<typeof schemas.PersonEducationProfilesShow.metadata>;
export type PersonEducationProfilesShowResponse200 = FromSchema<typeof schemas.PersonEducationProfilesShow.response['200']>;
export type PersonEducationProfilesUpdateBodyParam = FromSchema<typeof schemas.PersonEducationProfilesUpdate.body>;
export type PersonEducationProfilesUpdateMetadataParam = FromSchema<typeof schemas.PersonEducationProfilesUpdate.metadata>;
export type PersonEducationProfilesUpdateResponse200 = FromSchema<typeof schemas.PersonEducationProfilesUpdate.response['200']>;
export type PersonEmailsCreateBodyParam = FromSchema<typeof schemas.PersonEmailsCreate.body>;
export type PersonEmailsCreateMetadataParam = FromSchema<typeof schemas.PersonEmailsCreate.metadata>;
export type PersonEmailsCreateResponse200 = FromSchema<typeof schemas.PersonEmailsCreate.response['200']>;
export type PersonEmailsDestroyMetadataParam = FromSchema<typeof schemas.PersonEmailsDestroy.metadata>;
export type PersonEmailsDestroyResponse200 = FromSchema<typeof schemas.PersonEmailsDestroy.response['200']>;
export type PersonEmailsIndexMetadataParam = FromSchema<typeof schemas.PersonEmailsIndex.metadata>;
export type PersonEmailsIndexResponse200 = FromSchema<typeof schemas.PersonEmailsIndex.response['200']>;
export type PersonEmailsShowMetadataParam = FromSchema<typeof schemas.PersonEmailsShow.metadata>;
export type PersonEmailsShowResponse200 = FromSchema<typeof schemas.PersonEmailsShow.response['200']>;
export type PersonEmailsUpdateBodyParam = FromSchema<typeof schemas.PersonEmailsUpdate.body>;
export type PersonEmailsUpdateMetadataParam = FromSchema<typeof schemas.PersonEmailsUpdate.metadata>;
export type PersonEmailsUpdateResponse200 = FromSchema<typeof schemas.PersonEmailsUpdate.response['200']>;
export type PersonEventDocumentsCreateBodyParam = FromSchema<typeof schemas.PersonEventDocumentsCreate.body>;
export type PersonEventDocumentsCreateMetadataParam = FromSchema<typeof schemas.PersonEventDocumentsCreate.metadata>;
export type PersonEventDocumentsCreateResponse200 = FromSchema<typeof schemas.PersonEventDocumentsCreate.response['200']>;
export type PersonEventDocumentsDestroyMetadataParam = FromSchema<typeof schemas.PersonEventDocumentsDestroy.metadata>;
export type PersonEventDocumentsDestroyResponse200 = FromSchema<typeof schemas.PersonEventDocumentsDestroy.response['200']>;
export type PersonEventDocumentsDownloadMetadataParam = FromSchema<typeof schemas.PersonEventDocumentsDownload.metadata>;
export type PersonEventDocumentsDownloadResponse200 = FromSchema<typeof schemas.PersonEventDocumentsDownload.response['200']>;
export type PersonEventsCreateBodyParam = FromSchema<typeof schemas.PersonEventsCreate.body>;
export type PersonEventsCreateMetadataParam = FromSchema<typeof schemas.PersonEventsCreate.metadata>;
export type PersonEventsCreateResponse200 = FromSchema<typeof schemas.PersonEventsCreate.response['200']>;
export type PersonEventsDestroyMetadataParam = FromSchema<typeof schemas.PersonEventsDestroy.metadata>;
export type PersonEventsDestroyResponse200 = FromSchema<typeof schemas.PersonEventsDestroy.response['200']>;
export type PersonEventsIndexMetadataParam = FromSchema<typeof schemas.PersonEventsIndex.metadata>;
export type PersonEventsIndexResponse200 = FromSchema<typeof schemas.PersonEventsIndex.response['200']>;
export type PersonEventsShowMetadataParam = FromSchema<typeof schemas.PersonEventsShow.metadata>;
export type PersonEventsShowResponse200 = FromSchema<typeof schemas.PersonEventsShow.response['200']>;
export type PersonEventsUpdateBodyParam = FromSchema<typeof schemas.PersonEventsUpdate.body>;
export type PersonEventsUpdateMetadataParam = FromSchema<typeof schemas.PersonEventsUpdate.metadata>;
export type PersonEventsUpdateResponse200 = FromSchema<typeof schemas.PersonEventsUpdate.response['200']>;
export type PersonGlobalStatusesIndexMetadataParam = FromSchema<typeof schemas.PersonGlobalStatusesIndex.metadata>;
export type PersonGlobalStatusesIndexResponse200 = FromSchema<typeof schemas.PersonGlobalStatusesIndex.response['200']>;
export type PersonJobProfilesCreateBodyParam = FromSchema<typeof schemas.PersonJobProfilesCreate.body>;
export type PersonJobProfilesCreateMetadataParam = FromSchema<typeof schemas.PersonJobProfilesCreate.metadata>;
export type PersonJobProfilesCreateResponse200 = FromSchema<typeof schemas.PersonJobProfilesCreate.response['200']>;
export type PersonJobProfilesDestroyMetadataParam = FromSchema<typeof schemas.PersonJobProfilesDestroy.metadata>;
export type PersonJobProfilesDestroyResponse200 = FromSchema<typeof schemas.PersonJobProfilesDestroy.response['200']>;
export type PersonJobProfilesIndexMetadataParam = FromSchema<typeof schemas.PersonJobProfilesIndex.metadata>;
export type PersonJobProfilesIndexResponse200 = FromSchema<typeof schemas.PersonJobProfilesIndex.response['200']>;
export type PersonJobProfilesShowMetadataParam = FromSchema<typeof schemas.PersonJobProfilesShow.metadata>;
export type PersonJobProfilesShowResponse200 = FromSchema<typeof schemas.PersonJobProfilesShow.response['200']>;
export type PersonJobProfilesUpdateBodyParam = FromSchema<typeof schemas.PersonJobProfilesUpdate.body>;
export type PersonJobProfilesUpdateMetadataParam = FromSchema<typeof schemas.PersonJobProfilesUpdate.metadata>;
export type PersonJobProfilesUpdateResponse200 = FromSchema<typeof schemas.PersonJobProfilesUpdate.response['200']>;
export type PersonListItemsCreateBodyParam = FromSchema<typeof schemas.PersonListItemsCreate.body>;
export type PersonListItemsCreateMetadataParam = FromSchema<typeof schemas.PersonListItemsCreate.metadata>;
export type PersonListItemsCreateResponse200 = FromSchema<typeof schemas.PersonListItemsCreate.response['200']>;
export type PersonListItemsDestroyMetadataParam = FromSchema<typeof schemas.PersonListItemsDestroy.metadata>;
export type PersonListItemsDestroyResponse200 = FromSchema<typeof schemas.PersonListItemsDestroy.response['200']>;
export type PersonListItemsIndexMetadataParam = FromSchema<typeof schemas.PersonListItemsIndex.metadata>;
export type PersonListItemsIndexResponse200 = FromSchema<typeof schemas.PersonListItemsIndex.response['200']>;
export type PersonListItemsShowMetadataParam = FromSchema<typeof schemas.PersonListItemsShow.metadata>;
export type PersonListItemsShowResponse200 = FromSchema<typeof schemas.PersonListItemsShow.response['200']>;
export type PersonListItemsUpdateBodyParam = FromSchema<typeof schemas.PersonListItemsUpdate.body>;
export type PersonListItemsUpdateMetadataParam = FromSchema<typeof schemas.PersonListItemsUpdate.metadata>;
export type PersonListItemsUpdateResponse200 = FromSchema<typeof schemas.PersonListItemsUpdate.response['200']>;
export type PersonListsIndexMetadataParam = FromSchema<typeof schemas.PersonListsIndex.metadata>;
export type PersonListsIndexResponse200 = FromSchema<typeof schemas.PersonListsIndex.response['200']>;
export type PersonPhonesCreateBodyParam = FromSchema<typeof schemas.PersonPhonesCreate.body>;
export type PersonPhonesCreateMetadataParam = FromSchema<typeof schemas.PersonPhonesCreate.metadata>;
export type PersonPhonesCreateResponse200 = FromSchema<typeof schemas.PersonPhonesCreate.response['200']>;
export type PersonPhonesDestroyMetadataParam = FromSchema<typeof schemas.PersonPhonesDestroy.metadata>;
export type PersonPhonesDestroyResponse200 = FromSchema<typeof schemas.PersonPhonesDestroy.response['200']>;
export type PersonPhonesIndexMetadataParam = FromSchema<typeof schemas.PersonPhonesIndex.metadata>;
export type PersonPhonesIndexResponse200 = FromSchema<typeof schemas.PersonPhonesIndex.response['200']>;
export type PersonPhonesShowMetadataParam = FromSchema<typeof schemas.PersonPhonesShow.metadata>;
export type PersonPhonesShowResponse200 = FromSchema<typeof schemas.PersonPhonesShow.response['200']>;
export type PersonPhonesUpdateBodyParam = FromSchema<typeof schemas.PersonPhonesUpdate.body>;
export type PersonPhonesUpdateMetadataParam = FromSchema<typeof schemas.PersonPhonesUpdate.metadata>;
export type PersonPhonesUpdateResponse200 = FromSchema<typeof schemas.PersonPhonesUpdate.response['200']>;
export type PersonShareFieldTypesIndexMetadataParam = FromSchema<typeof schemas.PersonShareFieldTypesIndex.metadata>;
export type PersonShareFieldTypesIndexResponse200 = FromSchema<typeof schemas.PersonShareFieldTypesIndex.response['200']>;
export type PersonSmsOptInsCreateBodyParam = FromSchema<typeof schemas.PersonSmsOptInsCreate.body>;
export type PersonSmsOptInsCreateMetadataParam = FromSchema<typeof schemas.PersonSmsOptInsCreate.metadata>;
export type PersonSmsOptInsCreateResponse200 = FromSchema<typeof schemas.PersonSmsOptInsCreate.response['200']>;
export type PersonSmsOptInsIndexMetadataParam = FromSchema<typeof schemas.PersonSmsOptInsIndex.metadata>;
export type PersonSmsOptInsIndexResponse200 = FromSchema<typeof schemas.PersonSmsOptInsIndex.response['200']>;
export type PersonSmsOptInsShowMetadataParam = FromSchema<typeof schemas.PersonSmsOptInsShow.metadata>;
export type PersonSmsOptInsShowResponse200 = FromSchema<typeof schemas.PersonSmsOptInsShow.response['200']>;
export type PersonSocialProfilesCreateBodyParam = FromSchema<typeof schemas.PersonSocialProfilesCreate.body>;
export type PersonSocialProfilesCreateMetadataParam = FromSchema<typeof schemas.PersonSocialProfilesCreate.metadata>;
export type PersonSocialProfilesCreateResponse200 = FromSchema<typeof schemas.PersonSocialProfilesCreate.response['200']>;
export type PersonSocialProfilesDestroyMetadataParam = FromSchema<typeof schemas.PersonSocialProfilesDestroy.metadata>;
export type PersonSocialProfilesDestroyResponse200 = FromSchema<typeof schemas.PersonSocialProfilesDestroy.response['200']>;
export type PersonSocialProfilesIndexMetadataParam = FromSchema<typeof schemas.PersonSocialProfilesIndex.metadata>;
export type PersonSocialProfilesIndexResponse200 = FromSchema<typeof schemas.PersonSocialProfilesIndex.response['200']>;
export type PersonSocialProfilesShowMetadataParam = FromSchema<typeof schemas.PersonSocialProfilesShow.metadata>;
export type PersonSocialProfilesShowResponse200 = FromSchema<typeof schemas.PersonSocialProfilesShow.response['200']>;
export type PersonSocialProfilesUpdateBodyParam = FromSchema<typeof schemas.PersonSocialProfilesUpdate.body>;
export type PersonSocialProfilesUpdateMetadataParam = FromSchema<typeof schemas.PersonSocialProfilesUpdate.metadata>;
export type PersonSocialProfilesUpdateResponse200 = FromSchema<typeof schemas.PersonSocialProfilesUpdate.response['200']>;
export type PersonTypesIndexMetadataParam = FromSchema<typeof schemas.PersonTypesIndex.metadata>;
export type PersonTypesIndexResponse200 = FromSchema<typeof schemas.PersonTypesIndex.response['200']>;
export type PhoneTypesIndexMetadataParam = FromSchema<typeof schemas.PhoneTypesIndex.metadata>;
export type PhoneTypesIndexResponse200 = FromSchema<typeof schemas.PhoneTypesIndex.response['200']>;
export type PlacementsIndexMetadataParam = FromSchema<typeof schemas.PlacementsIndex.metadata>;
export type PlacementsIndexResponse200 = FromSchema<typeof schemas.PlacementsIndex.response['200']>;
export type PlacementsShowMetadataParam = FromSchema<typeof schemas.PlacementsShow.metadata>;
export type PlacementsShowResponse200 = FromSchema<typeof schemas.PlacementsShow.response['200']>;
export type PronounsIndexMetadataParam = FromSchema<typeof schemas.PronounsIndex.metadata>;
export type PronounsIndexResponse200 = FromSchema<typeof schemas.PronounsIndex.response['200']>;
export type QuestionTypesIndexMetadataParam = FromSchema<typeof schemas.QuestionTypesIndex.metadata>;
export type QuestionTypesIndexResponse200 = FromSchema<typeof schemas.QuestionTypesIndex.response['200']>;
export type ResumesCreateBodyParam = FromSchema<typeof schemas.ResumesCreate.body>;
export type ResumesCreateMetadataParam = FromSchema<typeof schemas.ResumesCreate.metadata>;
export type ResumesCreateResponse200 = FromSchema<typeof schemas.ResumesCreate.response['200']>;
export type ResumesDestroyMetadataParam = FromSchema<typeof schemas.ResumesDestroy.metadata>;
export type ResumesDestroyResponse200 = FromSchema<typeof schemas.ResumesDestroy.response['200']>;
export type ResumesDownloadMetadataParam = FromSchema<typeof schemas.ResumesDownload.metadata>;
export type ResumesDownloadResponse200 = FromSchema<typeof schemas.ResumesDownload.response['200']>;
export type ScheduleItemsIndexMetadataParam = FromSchema<typeof schemas.ScheduleItemsIndex.metadata>;
export type ScheduleItemsIndexResponse200 = FromSchema<typeof schemas.ScheduleItemsIndex.response['200']>;
export type ScheduleItemsShowMetadataParam = FromSchema<typeof schemas.ScheduleItemsShow.metadata>;
export type ScheduleItemsShowResponse200 = FromSchema<typeof schemas.ScheduleItemsShow.response['200']>;
export type SeniorityLevelsIndexMetadataParam = FromSchema<typeof schemas.SeniorityLevelsIndex.metadata>;
export type SeniorityLevelsIndexResponse200 = FromSchema<typeof schemas.SeniorityLevelsIndex.response['200']>;
export type SmsCreateBodyParam = FromSchema<typeof schemas.SmsCreate.body>;
export type SmsCreateMetadataParam = FromSchema<typeof schemas.SmsCreate.metadata>;
export type SmsCreateResponse200 = FromSchema<typeof schemas.SmsCreate.response['200']>;
export type SmsIndexMetadataParam = FromSchema<typeof schemas.SmsIndex.metadata>;
export type SmsIndexResponse200 = FromSchema<typeof schemas.SmsIndex.response['200']>;
export type SmsShowMetadataParam = FromSchema<typeof schemas.SmsShow.metadata>;
export type SmsShowResponse200 = FromSchema<typeof schemas.SmsShow.response['200']>;
export type SocialProfileTypesIndexMetadataParam = FromSchema<typeof schemas.SocialProfileTypesIndex.metadata>;
export type SocialProfileTypesIndexResponse200 = FromSchema<typeof schemas.SocialProfileTypesIndex.response['200']>;
export type SourceTypesCreateBodyParam = FromSchema<typeof schemas.SourceTypesCreate.body>;
export type SourceTypesCreateMetadataParam = FromSchema<typeof schemas.SourceTypesCreate.metadata>;
export type SourceTypesCreateResponse200 = FromSchema<typeof schemas.SourceTypesCreate.response['200']>;
export type SourceTypesDestroyMetadataParam = FromSchema<typeof schemas.SourceTypesDestroy.metadata>;
export type SourceTypesDestroyResponse200 = FromSchema<typeof schemas.SourceTypesDestroy.response['200']>;
export type SourceTypesIndexMetadataParam = FromSchema<typeof schemas.SourceTypesIndex.metadata>;
export type SourceTypesIndexResponse200 = FromSchema<typeof schemas.SourceTypesIndex.response['200']>;
export type SourceTypesShowMetadataParam = FromSchema<typeof schemas.SourceTypesShow.metadata>;
export type SourceTypesShowResponse200 = FromSchema<typeof schemas.SourceTypesShow.response['200']>;
export type SourceTypesUpdateBodyParam = FromSchema<typeof schemas.SourceTypesUpdate.body>;
export type SourceTypesUpdateMetadataParam = FromSchema<typeof schemas.SourceTypesUpdate.metadata>;
export type SourceTypesUpdateResponse200 = FromSchema<typeof schemas.SourceTypesUpdate.response['200']>;
export type StatesIndexMetadataParam = FromSchema<typeof schemas.StatesIndex.metadata>;
export type StatesIndexResponse200 = FromSchema<typeof schemas.StatesIndex.response['200']>;
export type UsersIndexMetadataParam = FromSchema<typeof schemas.UsersIndex.metadata>;
export type UsersIndexResponse200 = FromSchema<typeof schemas.UsersIndex.response['200']>;
export type VeteranStatusesIndexMetadataParam = FromSchema<typeof schemas.VeteranStatusesIndex.metadata>;
export type VeteranStatusesIndexResponse200 = FromSchema<typeof schemas.VeteranStatusesIndex.response['200']>;
export type WebhooksCreateBodyParam = FromSchema<typeof schemas.WebhooksCreate.body>;
export type WebhooksCreateMetadataParam = FromSchema<typeof schemas.WebhooksCreate.metadata>;
export type WebhooksCreateResponse200 = FromSchema<typeof schemas.WebhooksCreate.response['200']>;
export type WebhooksDestroyMetadataParam = FromSchema<typeof schemas.WebhooksDestroy.metadata>;
export type WebhooksDestroyResponse200 = FromSchema<typeof schemas.WebhooksDestroy.response['200']>;
export type WebhooksIndexMetadataParam = FromSchema<typeof schemas.WebhooksIndex.metadata>;
export type WebhooksIndexResponse200 = FromSchema<typeof schemas.WebhooksIndex.response['200']>;
export type WebhooksShowMetadataParam = FromSchema<typeof schemas.WebhooksShow.metadata>;
export type WebhooksShowResponse200 = FromSchema<typeof schemas.WebhooksShow.response['200']>;
export type WebhooksUpdateBodyParam = FromSchema<typeof schemas.WebhooksUpdate.body>;
export type WebhooksUpdateMetadataParam = FromSchema<typeof schemas.WebhooksUpdate.metadata>;
export type WebhooksUpdateResponse200 = FromSchema<typeof schemas.WebhooksUpdate.response['200']>;
export type WorkflowStagesIndexMetadataParam = FromSchema<typeof schemas.WorkflowStagesIndex.metadata>;
export type WorkflowStagesIndexResponse200 = FromSchema<typeof schemas.WorkflowStagesIndex.response['200']>;
export type WorkflowsIndexMetadataParam = FromSchema<typeof schemas.WorkflowsIndex.metadata>;
export type WorkflowsIndexResponse200 = FromSchema<typeof schemas.WorkflowsIndex.response['200']>;
