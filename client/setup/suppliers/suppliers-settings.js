import './suppliers-settings.html'
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from 'meteor/templating';
import "../../lib/global/indexdbstorage.js";
import LoadingOverlay from "../../LoadingOverlay";
import { UtilityService } from "../../utility-service";
import { ContactService } from "../../contacts/contact-service";
import XLSX from 'xlsx';
import { SideBarService } from '../../js/sidebar-service';
const utilityService = new UtilityService();
const contactService = new ContactService();
const sideBarService = new SideBarService();


Template.wizard_suppliers.onCreated(() => {
  // Template.wizard_suppliers.inheritsEventsFrom('non_transactional_list');
  // Template.wizard_suppliers.inheritsHelpersFrom('non_transactional_list');
  const templateObject = Template.instance();
    templateObject.datatablerecords = new ReactiveVar([]);
    templateObject.tableheaderrecords = new ReactiveVar([]);

    templateObject.selectedFile = new ReactiveVar();
    templateObject.displayfields = new ReactiveVar([]);
    templateObject.reset_data = new ReactiveVar([]);
    templateObject.setupFinished = new ReactiveVar();


    templateObject.getDataTableList = function(data) {
        let linestatus = '';
        if (data.Active == true) {
            linestatus = "";
        } else if (data.Active == false) {
            linestatus = "In-Active";
        };

        let arBalance = utilityService.modifynegativeCurrencyFormat(data.ARBalance) || 0.00;
        let creditBalance = utilityService.modifynegativeCurrencyFormat(data.ExcessAmount) || 0.00;
        let balance = utilityService.modifynegativeCurrencyFormat(data.Balance) || 0.00;
        let creditLimit = utilityService.modifynegativeCurrencyFormat(data.SupplierCreditLimit) || 0.00;
        let salesOrderBalance = utilityService.modifynegativeCurrencyFormat(data.Balance) || 0.00;

        var dataList = [
          
            data.ClientID || '',
            data.Company || '',
            data.Phone || '',
            arBalance || 0.00,
            creditBalance || 0.00,
            balance || 0.00,
            creditLimit || 0.00,
            salesOrderBalance || 0.00,
            data.Suburb || '',
            data.Country || '',
            data.Notes || '',
            linestatus,
            
            
        ];
        return dataList;
    }

    let headerStructure = [
        { index: 0, label: 'ID', class: 'colID', active: false, display: false, width: "20" },
        { index: 1, label: 'Company', class: 'colCompany', active: true, display: true, width: "200" },
        { index: 2, label: 'Phone', class: 'colPhone', active: true, display: true, width: "95" },
        { index: 3, label: 'AR Balance', class: 'colARBalance', active: true, display: true, width: "90" },
        { index: 4, label: 'Credit Balance', class: 'colCreditBalance', active: true, display: true, width: "50" },
        { index: 5, label: 'Balance', class: 'colBalance', active: true, display: true, width: "80" },
        { index: 6, label: 'Credit Limit', class: 'colCreditLimit', active: true, display: true, width: "90" },
        { index: 7, label: 'Order Balance', class: 'colSalesOrderBalance', active: true, display: true, width: "120" },
        { index: 8, label: 'City/Suburb', class: 'colSuburb', active: true, display: true, width: "100" },
        { index: 9, label: 'Country', class: 'colCountry', active: true, display: true, width: "100" },
        { index: 10, label: 'Comments', class: 'colNotes', active: true, display: true, width: "200" },
        { index: 11, label: "Status", class: "colStatus", active: true, display: true, width: "120" },
        
       
        
    ];
    templateObject.tableheaderrecords.set(headerStructure);
})

Template.wizard_suppliers.onRendered(() => {

})

Template.wizard_suppliers.helpers({
  datatablerecords: () => {
    return Template.instance().datatablerecords.get().sort(function(a, b) {
        if (a.company == 'NA') {
            return 1;
        } else if (b.company == 'NA') {
            return -1;
        }
        return (a.company.toUpperCase() > b.company.toUpperCase()) ? 1 : -1;
    });
},
tableheaderrecords: () => {
    return Template.instance().tableheaderrecords.get();
},
salesCloudPreferenceRec: () => {
    return CloudPreference.findOne({ userid: localStorage.getItem('mycloudLogonID'), PrefName: 'tblSetupSupplierlist' });
},
getSkippedSteps() {
    let setupUrl = localStorage.getItem("VS1Cloud_SETUP_SKIPPED_STEP") || JSON.stringify().split();
    return setupUrl[1];
},
// custom fields displaysettings
displayfields: () => {
    return Template.instance().displayfields.get();
},
isSetupFinished: () => {
    return Template.instance().setupFinished.get();
},

apiFunction:function() {
    let sideBarService = new SideBarService();
    return sideBarService.getAllSuppliersDataVS1List;
},

searchAPI: function() {
    return sideBarService.getAllSuppliersDataVS1ByName;
},

service: ()=>{
    let sideBarService = new SideBarService();
    return sideBarService;

},

datahandler: function () {
    let templateObject = Template.instance();
    return function(data) {
        let dataReturn =  templateObject.getDataTableList(data)
        return dataReturn
    }
},

exDataHandler: function() {
    let templateObject = Template.instance();
    return function(data) {
        let dataReturn =  templateObject.getDataTableList(data)
        return dataReturn
    }
},

apiParams: function() {
    return ['limitCount', 'limitFrom', 'deleteFilter'];
},
})

Template.wizard_suppliers.events({
  "click #btnNewSupplier": (e) => {
    $($(e.currentTarget).attr("data-toggle")).modal("toggle");
  },
  "click #tblSetupSupplierlist tbody tr": (e) => { },

  "click #btn-supplier-refresh"(e){
    $('.fullScreenSpin').css('display', 'inline-block');
    location.reload()
    $(".modal.show").modal("hide");
  },
  "click #tblSupplierlist tbody tr": (e, ui) => {
    const id = $(e.currentTarget).attr('id');
    if(id){
        FlowRouter.go(`/supplierscard?id=${id}`);
    }
},
'click .btnRefreshSuppliers': function(event) {
    let templateObject = Template.instance();
    let utilityService = new UtilityService();
    let tableProductList;
    const dataTableList = [];
    var splashArrayInvoiceList = new Array();
    const lineExtaSellItems = [];
    $('.fullScreenSpin').css('display', 'inline-block');
    let dataSearchName = $('#tblSupplierlist_filter input').val();
    if (dataSearchName.replace(/\s/g, '') != '') {
        sideBarService.getNewSupplierByNameOrID(dataSearchName).then(function(data) {
            $(".btnRefreshSuppliers").removeClass('btnSearchAlert');
            let lineItems = [];
            let lineItemObj = {};
            if (data.tsuppliervs1list.length > 0) {
                for (let i = 0; i < data.tsuppliervs1list.length; i++) {
                    let linestatus = '';
                    if (data.tsuppliervs1list[i].Active == true) {
                        linestatus = "";
                    } else if (data.tsuppliervs1list[i].Active == false) {
                        linestatus = "In-Active";
                    };
                    let arBalance = utilityService.modifynegativeCurrencyFormat(data.tsuppliervs1list[i].ARBalance) || 0.00;
                    let creditBalance = utilityService.modifynegativeCurrencyFormat(data.tsuppliervs1list[i].ExcessAmount) || 0.00;
                    let balance = utilityService.modifynegativeCurrencyFormat(data.tsuppliervs1list[i].Balance) || 0.00;
                    let creditLimit = utilityService.modifynegativeCurrencyFormat(data.tsuppliervs1list[i].SupplierCreditLimit) || 0.00;
                    let salesOrderBalance = utilityService.modifynegativeCurrencyFormat(data.tsuppliervs1list[i].Balance) || 0.00;
                    var dataList = {
                        id: data.tsuppliervs1list[i].ClientID || '',
                        company: data.tsuppliervs1list[i].Company || '',
                        phone: data.tsuppliervs1list[i].Phone || '',
                        arbalance: arBalance || 0.00,
                        creditbalance: creditBalance || 0.00,
                        balance: balance || 0.00,
                        creditlimit: creditLimit || 0.00,
                        salesorderbalance: salesOrderBalance || 0.00,
                        suburb: data.tsuppliervs1list[i].Suburb || '',
                        country: data.tsuppliervs1list[i].Country || '',
                        email: data.tsuppliervs1list[i].Email || '',
                        accountno: data.tsuppliervs1list[i].AccountNo || '',
                        clientno: data.tsuppliervs1list[i].ClientNo || '',
                        jobtitle: data.tsuppliervs1list[i].JobTitle || '',
                        notes: data.tsuppliervs1list[i].Notes || '',
                        status:linestatus
                    };

                    dataTableList.push(dataList);
                }

                templateObject.datatablerecords.set(dataTableList);

            } else {
                $('.fullScreenSpin').css('display', 'none');
                swal({
                    title: 'Question',
                    text: "Supplier does not exist, would you like to create it?",
                    type: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No'
                }).then((result) => {
                    if (result.value) {
                        FlowRouter.go('/supplierscard');
                    } else if (result.dismiss === 'cancel') {
                        //$('#productListModal').modal('toggle');
                    }
                });
            }

        }).catch(function(err) {
            $('.fullScreenSpin').css('display', 'none');
        });
    } else {
        $(".btnRefresh").trigger("click");
    }
},
'click .btnRefresh': function() {
    $(".fullScreenSpin").css("display", "inline-block");
    let templateObject = Template.instance();
    sideBarService.getAllSuppliersDataVS1List(initialDataLoad, 0).then(function (data) {
        addVS1Data("TSupplierVS1List", JSON.stringify(data)).then(function (datareturn) {
          sideBarService.getAllSuppliersDataVS1List(initialDataLoad, 0, false).then(function (dataUsers) {
            addVS1Data('TSupplierVS1List', JSON.stringify(dataUsers)).then(function (datareturn) {
                window.open("/supplierlist", "_self");
              }).catch(function (err) {
                window.open("/supplierlist", "_self");
              });
          });
          }).catch(function (err) {
            window.open("/supplierlist", "_self");
          });
      }).catch(function (err) {
        sideBarService.getAllSuppliersDataVS1List().then(function (dataUsers) {
          addVS1Data('TSupplierVS1List', JSON.stringify(dataUsers)).then(function (datareturn) {
              window.open("/supplierlist", "_self");
            }).catch(function (err) {
              window.open("/supplierlist", "_self");
            });
        });
      });
  },

'click .templateDownload': function() {
    let utilityService = new UtilityService();
    let rows = [];
    const filename = 'SampleSupplier' + '.csv';
    rows[0] = ['Company', 'First Name', 'Last Name', 'Phone', 'Mobile', 'Email', 'Skype', 'Street', 'City/Suburb', 'State', 'Post Code', 'Country'];
    rows[1] = ['ABC Company', 'John', 'Smith', '9995551213', '9995551213', 'johnsmith@email.com', 'johnsmith', '123 Main Street', 'Brooklyn', 'New York', '1234', 'United States'];
    utilityService.exportToCsv(rows, filename, 'csv');
},
'click .templateDownloadXLSX': function(e) {

    e.preventDefault(); //stop the browser from following
    window.location.href = 'sample_imports/SampleSupplier.xlsx';
},
'click .btnUploadFile': function(event) {
    $('#attachment-upload').val('');
    $('.file-name').text('');
    //$(".btnImport").removeAttr("disabled");
    $('#attachment-upload').trigger('click');

},
'change #attachment-upload': function(e) {
    let templateObj = Template.instance();
    var filename = $('#attachment-upload')[0].files[0]['name'];
    var fileExtension = filename.split('.').pop().toLowerCase();
    var validExtensions = ["csv", "txt", "xlsx"];
    var validCSVExtensions = ["csv", "txt"];
    var validExcelExtensions = ["xlsx", "xls"];

    if (validExtensions.indexOf(fileExtension) == -1) {
        swal('Invalid Format', 'formats allowed are :' + validExtensions.join(', '), 'error');
        $('.file-name').text('');
        $(".btnImport").Attr("disabled");
    } else if (validCSVExtensions.indexOf(fileExtension) != -1) {

        $('.file-name').text(filename);
        let selectedFile = event.target.files[0];

        templateObj.selectedFile.set(selectedFile);
        if ($('.file-name').text() != "") {
            $(".btnImport").removeAttr("disabled");
        } else {
            $(".btnImport").Attr("disabled");
        }
    } else if (fileExtension == 'xlsx') {
        $('.file-name').text(filename);
        let selectedFile = event.target.files[0];
        var oFileIn;
        var oFile = selectedFile;
        var sFilename = oFile.name;
        // Create A File Reader HTML5
        var reader = new FileReader();

        // Ready The Event For When A File Gets Selected
        reader.onload = function(e) {
            var data = e.target.result;
            data = new Uint8Array(data);
            var workbook = XLSX.read(data, { type: 'array' });

            var result = {};
            workbook.SheetNames.forEach(function(sheetName) {
                var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
                var sCSV = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
                templateObj.selectedFile.set(sCSV);

                if (roa.length) result[sheetName] = roa;
            });
            // see the result, caution: it works after reader event is done.

        };
        reader.readAsArrayBuffer(oFile);

        if ($('.file-name').text() != "") {
            $(".btnImport").removeAttr("disabled");
        } else {
            $(".btnImport").Attr("disabled");
        }

    }
},
'click .btnImport': function() {
    $('.fullScreenSpin').css('display', 'inline-block');
    let templateObject = Template.instance();
    let contactService = new ContactService();
    let objDetails;
    let firstName = '';
    let lastName = '';
    let taxCode = '';
    Papa.parse(templateObject.selectedFile.get(), {
        complete: function(results) {

            if (results.data.length > 0) {
                if ((results.data[0][0] == "Company") && (results.data[0][1] == "First Name") &&
                    (results.data[0][2] == "Last Name") && (results.data[0][3] == "Phone") &&
                    (results.data[0][4] == "Mobile") && (results.data[0][5] == "Email") &&
                    (results.data[0][6] == "Skype") && (results.data[0][7] == "Street") &&
                    (results.data[0][8] == "Street2" || results.data[0][8] == "City/Suburb") && (results.data[0][9] == "State") &&
                    (results.data[0][10] == "Post Code") && (results.data[0][11] == "Country")) {

                    let dataLength = results.data.length * 500;
                    setTimeout(function() {
                        window.open('/supplierlist?success=true', '_self');
                        $('.fullScreenSpin').css('display', 'none');
                    }, parseInt(dataLength));

                    for (let i = 0; i < results.data.length - 1; i++) {
                        firstName = results.data[i + 1][1] !== undefined ? results.data[i + 1][1] : '';
                        lastName = results.data[i + 1][2] !== undefined ? results.data[i + 1][2] : '';
                        //taxCode = results.data[i+1][12]!== undefined? results.data[i+1][12] :'NT';

                        objDetails = {
                            type: "TSupplier",
                            fields: {
                                ClientName: results.data[i + 1][0],
                                FirstName: firstName || '',
                                LastName: lastName || '',
                                Phone: results.data[i + 1][3],
                                Mobile: results.data[i + 1][4],
                                Email: results.data[i + 1][5],
                                SkypeName: results.data[i + 1][6],
                                Street: results.data[i + 1][7],
                                Street2: results.data[i + 1][8],
                                Suburb: results.data[i + 1][8] || '',
                                State: results.data[i + 1][9],
                                PostCode: results.data[i + 1][10],
                                Country: results.data[i + 1][11],

                                BillStreet: results.data[i + 1][7],
                                BillStreet2: results.data[i + 1][8],
                                BillState: results.data[i + 1][9],
                                BillPostCode: results.data[i + 1][10],
                                Billcountry: results.data[i + 1][11],
                                //TaxCodeName:taxCode||'NT',
                                PublishOnVS1: true
                            }
                        };
                        if (results.data[i + 1][1]) {
                            if (results.data[i + 1][1] !== "") {
                                contactService.saveSupplier(objDetails).then(function(data) {
                                    //$('.fullScreenSpin').css('display','none');
                                    //  Meteor._reload.reload();
                                }).catch(function(err) {
                                    //$('.fullScreenSpin').css('display','none');
                                    swal({ title: 'Oooops...', text: err, type: 'error', showCancelButton: false, confirmButtonText: 'Try Again' }).then((result) => {
                                        if (result.value) {
                                            window.open('/supplierlist?success=true', '_self');
                                        } else if (result.dismiss === 'cancel') {
                                            window.open('/supplierlist?success=false', '_self');
                                        }
                                    });
                                });
                            }
                        }
                    }

                } else {
                    $('.fullScreenSpin').css('display', 'none');
                    swal('Invalid Data Mapping fields ', 'Please check that you are importing the correct file with the correct column headers.', 'error');
                }
            } else {
                $('.fullScreenSpin').css('display', 'none');
                swal('Invalid Data Mapping fields ', 'Please check that you are importing the correct file with the correct column headers.', 'error');
            }


        }
    });
}

})