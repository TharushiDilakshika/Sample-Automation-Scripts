const { test, expect } = require('@playwright/test');
const { Login } = require('../pages/LGN_Login/Login');
const { Common } = require('../pages/GEN_General/GeneralMethods');
const { getTestData } = require('../helpers/data.helper');
const { customerSummary } = require('../pages/CUS_CustomerSummary/CustomerSummary');
const { cashAccount } = require('../pages/CUS_CashAccount/CashAccount');
const { SecurityAccount } = require('../pages/CUS_SecurityAccount/SecurityAcc');
const { CustomerList } = require('../pages/CUS_CustomerList/CustomerList');
const APIActions = require('../lib/APIActions');
const { OrderList } = require('../pages/TRADE_OrderList/OrderList')
import { CommonLocators } from '../pages/GEN_General/Locators';


// let testData;
// let page;
// let ENV_NAME = process.env.ENV_NAME;

let testData;
let page;
let ENV_NAME = process.env.ENV_NAME;
let CashAccountData;
let GlobalSearchData;

test.beforeAll(async () => {
    testData = getTestData();
    const apiActions = new APIActions();
    const Data = await apiActions.readDataFromJSONFile(`${ENV_NAME}`);
    CashAccountData = Data.CashAccountData;
    GlobalSearchData = Data.GlobalSearchData;
});

test.beforeEach(async ({ page }) => {
    await page.goto(`/?disablePostLoginModals=true`);
    await new Promise(resolve => setTimeout(resolve, 8000));
    await page.setViewportSize({ width: 1920, height: 1080 });
    //const common = new Common(page);
    //await common.closeAllTabs();
});

test.afterEach(async ({ page }, testInfo) => {
    console.log(`Finished ${testInfo.title} with status ${testInfo.status}`);
    if (testInfo.status !== testInfo.expectedStatus)
        console.log(`Did not run as expected, ended up at ${page.url()}`);
});

test.afterAll(async ({ browser }) => {
    const contexts = browser.contexts();
    for (const context of contexts) {
        await context.close();
    }
});

test('Change Institution to Dutrade', async ({ page }) => {
    const login = new Login(page);
    const common = new Common(page);
    await login.loginToAT(testData.username, testData.password);
    await common.handleEnablePushNotificationIfVisible();
    await common.changeInstitution(CommonLocators.InstitutionDutrade);
});

test('Change Language to Arabic', async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await common.changeLanguage(CommonLocators.ArabicLng);
    await login.loginToAT(testData.username, testData.password);
});

test('Change Language to English', async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await common.changeLanguage(CommonLocators.EnglishLng);
    await login.loginToAT(testData.username, testData.password);


test(' Settings - Verify Changing Theme in Web Application', async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeTheme();
});

test('PTT-TC-942: Settings - Verify Language Change Functionality in Application', { tag: ['@regression'] }, async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeLanguageAfterLogin();
});

test('PTT-TC-956: Settings - Help - Verify that user can link to help documentation.', { tag: ['@regression'] }, async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.linkToHelpDocumentation();
});


//Send Email for Statement
test('PTT-TC-968: Send Email for Statement - Verify Email Sending Functionality for Cash Statements', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const cashAcc = new cashAccount(page);
    const CusSumm = new customerSummary(page);
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await CusSumm.navigateToCustomerSummaryGeneral();
    await cashAcc.searchCustomerByNumber();
    await cashAcc.changeCashAccount();
    await cashAcc.navigateToCashStatement();
    await cashAcc.SelectLastMonth();
    await cashAcc.generateCashStatement();
    await common.navigateToDownloadsTab();
    await common.sendEmailForStatement();

});

test('PTT-TC-969: Send Email for Statement - Verify Email Sending Functionality for Holding Statements', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const cashAcc = new cashAccount(page);
    const CusSumm = new customerSummary(page);
    const common = new Common(page);
    const SecurityAcc = new SecurityAccount(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await CusSumm.navigateToCustomerSummaryGeneral();
    await cashAcc.searchCustomerByNumber();
    await cashAcc.changeCashAccount();
    await SecurityAcc.navigateToHoldingStatement();
    await SecurityAcc.SelectHoldingStatement();
    await cashAcc.SelectLastMonth();
    await SecurityAcc.selectTradingAccounts();
    await SecurityAcc.generateHoldingStatement();
    await common.navigateToDownloadsTab();
    await common.sendEmailForStatement();

});

test('PTT-TC-971: Send Email for Statement - Verify Email Sending Functionality for Customer Portfolio summary statements', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const CusSumm = new customerSummary(page);
    const cashAcc = new cashAccount(page);
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await CusSumm.navigateToCustomerSummaryGeneral();
    await cashAcc.searchCustomerByNumber();
    //await CusSumm.searchCustomerByCustomerID(customerSummaryLocators.customerID);
    await CusSumm.navigateToCustomerPortfolioSummary();
    await CusSumm.selectDate();
    await CusSumm.selectTradingAcc();
    await CusSumm.generateReport();
    await CusSumm.navigateToDownloads();
    await common.sendEmailForStatement();
});

test('PTT-TC-970: Send Email for Statement - Verify Email Sending Functionality for Bond Holding statements', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const cashAcc = new cashAccount(page);
    const CusSumm = new customerSummary(page);
    const common = new Common(page);
    const SecurityAcc = new SecurityAccount(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await CusSumm.navigateToCustomerSummaryGeneral();
    //await CusSumm.searchCustomerByName();
    await cashAcc.searchCustomerByNumber();
    await common.changeCashAccountforFixedIncome();
    await SecurityAcc.navigateToHoldingStatement();
    await SecurityAcc.SelectBondHoldingStatement();
    await common.SelectCurrentMonth();
    await SecurityAcc.selectTradingAccounts();
    await SecurityAcc.generateBondHoldingStatement();
    await common.navigateToDownloadsTab();
    await common.sendEmailForStatement();

});

test('PTT-TC-960: Manage Tabs - Verify the Manage Tabs Popup Appears When Opening a 15th Tab', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    const customerlist = new CustomerList(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await customerlist.navigateToCustomerList();
    await common.openFifteenTabs();
    await common.verifyManageTabsPopup();
});

//Global Search

test('PTT-TC-1436: Global Search - Verify search with a valid input for Features option',{ tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await common.navigateToGlobalSearch();
    await common.FeaturesInGlobalSearch();
    await common.AssertFeaturesInGlobalSearch();
    await common.navigateToGlobalSearch();
    await common.ExactFeatureInGlobalSearch();
    await common.AssertExactFeatureInGlobalSearch();
});

test('PTT-TC-1437: Global Search - Verify search with a valid input for Customers option',{ tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await common.navigateToGlobalSearch();
    await common.CustomersInGlobalSearch();
    await common.AssertCustomersInGlobalSearch();
    await common.navigateToGlobalSearch();
    await common.ExactCustomerInGlobalSearch();
    await common.AssertExactCustomerInGlobalSearch();
});


test('PTT-TC-1435: Global Search - Verify search with a valid input for All option',{ tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await common.closeAllTabs();
    await common.navigateToGlobalSearch();
    await common.AllOptionInGlobalSearch();
    await common.AssertAllInGlobalSearch();
});

//Notification Management(Configuration)
test('PTT-TC-923: Configuration- Notification Management - Verify add Notification Template Type',{ tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await common.navigateToNotificationManagement();
    await common.addNotificationTemplateType();
    await common.deleteNotificationTemplateType();
});

test('PTT-TC-924: Configuration- Notification Management -Verify Edit Notification Template Type',{ tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await common.navigateToNotificationManagement();
    await common.addNotificationTemplateType();
    await common.editNotificationTemplateType();
    await common.deleteNotificationTemplateType();
});

test('PTT-TC-927: Configuration- Notification Management - Verify Add Email Template for a Type',{ tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await common.navigateToNotificationManagement();
    await common.addNotificationTemplateType();
    await common.addNotificationEmailTemplateBody();
    await common.deleteNotificationTemplateBody();
    await common.deleteNotificationTemplateType();
});

test('PTT-TC-928: Configuration- Notification Management -Verify Add SMS Template for a Type',{ tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const common = new Common(page);
    const login = new Login(page);
    await login.loginToAT(testData.username, testData.password);
    await common.changeInstitution(CommonLocators.Institution);
    await common.navigateToNotificationManagement();
    await common.addNotificationTemplateType();
    await common.addNotificationSMSTemplateBody();
    await common.deleteNotificationTemplateBody();
    await common.deleteNotificationTemplateType();
});

 















