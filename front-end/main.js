import React from 'react';
import "../fontAwesome/fontAwesome.js"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById("app"));
const Button = props =>
    <><button className={props.className ? props.className : "" }
        onClick={props.onClick} type = "button">
        {props.text}
    </button></>
const BankList = props => {
    let edit = props.edit, editRow, editColumn;
    if (edit) {
        editRow = props.edit.row;
        editColumn = props.edit.column;
    }
    return <>
        <table>
            <thead>
                <tr>
                    {props.header.map((header, index) =>
                        <th key={index + header.name}>{header.name}</th>
                    )}
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {
                    props.data.map(((curDataRow, row) =>
                        <tr key={row + "tr"}>
                            {curDataRow.map((curCol, col) => {
                                return <th onDoubleClick={props.doubleClickFunc}
                                    key={row + col.toString()} data-row={row} data-col={col}>
                                    {
                                        row == editRow && col == editColumn ?
                                            <form key={row + col.toString()} onSubmit={props.dataSaveFunc}>
                                                <input key={row + col.toString()} type={props.header[col].type}
                                                    defaultValue={curCol} min={props.header[col].min} required
                                                    max={props.header[col].isPercent ? 100 : null}
                                                ></input>
                                            </form> : curCol
                                    }
                                </th>
                            })}
                            <th data-row={row}>
                                <button type="button" data-row={row} onClick={props.deleteBankFunc}>
                                    <FontAwesomeIcon icon="fa-solid fa-trash-can" data-row={row} />
                                </button>
                            </th>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    </>
}
const CreditCalculator = props => {
    let ResultOutput = null;
    if (props.calcResult) {
        ResultOutput = <>
            <div className='resultOutputContainer'>
                <h2>Result</h2>
                <output>
                    {props.calcResult}
                </output>
            </div>
        </>
    }
    return <>
        <form onSubmit={props.calcValueSubmitFunc}>
            <div className="initalLoanContainer">
                <label htmlFor="InitialLoan">Initial Loan</label>
                <input className={'CreditCalcInputLoan' + (~props.incorectInput.indexOf(0) ? " incorrect" : "")}
                    type="number" name={"InitialLoan"} placeholder={"Initial loan"} required min={0}></input>
            </div>
            <div className="InputPaymentContainer">
                <label htmlFor="CreditCalcInputPayment">Payment</label>
                <input className={'CreditCalcInputPayment' + (~props.incorectInput.indexOf(1) ? " incorrect" : "")}
                    type="number" name={"DownPayment"} placeholder={"Down payment"} required min={0}></input>
            </div>
            <div className='select'>
                <label htmlFor='bank'>Select bank</label>
                <select name="bank" className='bankSelectDropDown' key={1}>
                    {
                        props.data.map((curDataRow, index) =>
                            <><option key={(index + curDataRow).toString()} value={index}>
                                {curDataRow[0].toString()}
                            </option></>)
                    }
                </select>
            </div>
            <div className='calcButtonContainer'>
                <button type="submit">Submit</button>
                {Button({
                    className: "exitCalc",
                    text: "exit",
                    onClick: props.exitCalcFunc,
                })}
            </div>
        </form>
        {ResultOutput}
    </>
}
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: JSON.parse(localStorage.getItem('data')) ? JSON.parse(localStorage.getItem('data')) : [],
            edit: null,
            addNewBank: null,
            isNeedDisplayCalc: false,
            calcResult: null,
            incorrectCalcInput: [],
            sortBy: this.props.headers[0].index,
            isAscending: false,
            saveBankError: false,
            bankNumError: false,
        }
        this._addNewBank = this._addNewBank.bind(this);
        this._displayEditor = this._displayEditor.bind(this);
        this._saveData = this._saveData.bind(this);
        this._deleteBank = this._deleteBank.bind(this);
        this._calcValueSubmit = this._calcValueSubmit.bind(this);
        this._displayCreditCalc = this._displayCreditCalc.bind(this);
        this._sortChange = this._sortChange.bind(this);
        this._sort = this._sort.bind(this);
        this._ascendingChange = this._ascendingChange.bind(this);
        this._saveBankChange = this._saveBankChange.bind(this);
    }
    _saveBankChange(e) {
        let column = e.target.closest('th').cellIndex;
        let newAddBankValue = this.state.addNewBank.BankValue;
        newAddBankValue[column] = e.target.value;
        this.setState({
            addNewBank: {
                BankValue: newAddBankValue,
            }
        })
    }
    calcMortgage(bankIndex, downPayment, p, header) {
        p -= (p / 100) * downPayment;
        let r = this.state.data[bankIndex][header.find(head => head.name == "Interest rate").index];
        r = parseInt(r);
        let n = p / this.state.data[bankIndex][header.find(head => head.name == "Loan term").index] - 0;
        let rDiv12 = r / 12;
        return (p * rDiv12 * Math.pow(1 + rDiv12, n)) / (Math.pow(1 + rDiv12, n) - 1);
    }
    _calcValueSubmit(e) {
        e.preventDefault();
        if (!this.state.data.length) {
            return;
        }
        let initalLoan = e.target.InitialLoan.value - 0, bankIndex = e.target.bank.value;
        let newIncorrectInput = [];
        if (!(bankIndex + 1)) {
            newIncorrectInput.push(3);
            return;
        }
        let downPayment = e.target.DownPayment.value - 0, header = this.props.headers;
        let maxInitialLoan = this.state.data[bankIndex][header.find(head => head.name == "Maximum loan").index];
        let minDownPayment = this.state.data[bankIndex][header.find(head => head.name == "Minimum down payment").index];
        minDownPayment = parseInt(minDownPayment);
        maxInitialLoan = parseInt(maxInitialLoan);
        let isEnterDataValid = ((initalLoan <= maxInitialLoan) && (downPayment > minDownPayment));
        if (isEnterDataValid) {
            this.setState({
                calcResult: this.calcMortgage(bankIndex, downPayment, initalLoan, header),
                incorrectCalcInput: [],
            })
            return;
        }

        if (initalLoan > maxInitialLoan) {
            newIncorrectInput.push(0);
        }
        if (!downPayment < minDownPayment) {
            newIncorrectInput.push(1);
        }
        this.setState({
            incorrectCalcInput: newIncorrectInput,
        })
    }
    _displayEditor(e) {
        let isItDeleteButton = e.target.cellIndex == this.props.headers.length;
        if (this.state.addNewBank || isItDeleteButton) {
            return;
        }
        let editColumn = e.target.cellIndex, editRow = parseInt(e.target.dataset.row, 10);
        this.setState({
            edit: {
                column: editColumn,
                row: editRow,
            }
        })
    }
    _displayCreditCalc() {
        let newDisplCalValue = !this.state.isNeedDisplayCalc, newData = this.state.data;
        if (this.state.addNewBank){
            let curNewBankValue = this.state.addNewBank.BankValue;
            curNewBankValue = curNewBankValue.filter(el => !!el);
            if (curNewBankValue.length !== this.props.headers.length) {
                this.setState({
                    saveBankError: true,
                })
                return;
            }
            curNewBankValue = curNewBankValue.map((el, index) => {
                return this.props.headers[index].isPercent ? el += " %" : el;
            })
            let newDataRow = newData[newData.length - 1].map((el,index)=> curNewBankValue[index]);
            newData.pop()
            newData.push(newDataRow);
            localStorage.setItem('data', JSON.stringify(newData));
        }
        if(newData.length < 1){
            this.setState({
                bankNumError:true,
            });
            return;
        }
        this.setState({
            isNeedDisplayCalc: newDisplCalValue,
            incorrectCalcInput: [],
            data: newData, 
            bankNumError:false,
        });
    }
    _saveData(e) {
        let newData = this.state.data;
        if (this.state.addNewBank) {
            let curNewBankValue = this.state.addNewBank.BankValue;
            curNewBankValue = curNewBankValue.filter(el => !!el);
            if (curNewBankValue.length !== this.props.headers.length) {
                this.setState({
                    saveBankError: true,
                })
                return;
            }
            curNewBankValue = curNewBankValue.map((el, index) => {
                return this.props.headers[index].isPercent ? el += " %" : el;
            })
            let newDataRow = newData[newData.length - 1].map((el,index)=> curNewBankValue[index]);
            newData.pop()
            newData.push(newDataRow);
            
            localStorage.setItem('data', JSON.stringify(newData));
            this.setState({
                data: newData,
                saveBankError: false,
                addNewBank:null,
                bankNumError:false,
            });
            return;
        }
        e.preventDefault();
        let inputValue = e.target.firstChild.value;
        if (this.props.headers[this.state.edit.column].isPercent) {
            inputValue += " %";
        }
        newData[this.state.edit.row][this.state.edit.column] = inputValue;

        localStorage.setItem('data', JSON.stringify(newData));
        this.setState({
            edit: null,
            data: newData,
        })
        return;
    }
    _sort() {
        let sortByIndex = this.state.sortBy;
        let newData = this.state.data;
        newData.sort((el1, el2) => {
            if (this.props.headers[sortByIndex].type == "text") {
                if (this.state.isAscending) {
                    return el2[sortByIndex].toLowerCase().charCodeAt(0) - el1[sortByIndex].toLowerCase().charCodeAt(0);
                }
                return el1[sortByIndex].toLowerCase().charCodeAt(0) - el2[sortByIndex].toLowerCase().charCodeAt(0);
            }
            if (this.state.isAscending) {
                return parseInt(el2[sortByIndex]) - parseInt(el1[sortByIndex]);
            }
            return parseInt(el1[sortByIndex]) - parseInt(el2[sortByIndex]);
        });
        localStorage.setItem('data', JSON.stringify(newData));
        this.setState({
            data: newData,
        })
    }
    _deleteBank(e) {
        let deleteBankRow = parseInt(e.target.closest('th').dataset.row, 10), curData = this.state.data;
        if (!(deleteBankRow + 1)) {
            return;
        }
        curData.splice(deleteBankRow, 1);
        localStorage.setItem('data', JSON.stringify(curData));
        if (this.state.addNewBank && this.state.addNewBank) {
            this.setState({
                data: curData,
                addNewBank: null,
                saveBankError: false,
            });
            return;
        }
        this.setState({
            data: curData,
        });
    }
    _addNewBank() {
        if (this.state.addNewBank) {
            return null;
        }
        let currentData = this.state.data;
        currentData.push(this.props.headers.map((el, index) => {
            if (!el.type || (el.type != "number" && el.type != "text")) {
                el.type = "text";
            }
            else if (el.type == "number") {
                el.min = 0;
            }
            return <>
                <input key={index.toString()} type={el.type}
                    placeholder={el.name} min={el.min}
                    required max={this.props.headers[index].isPercent ? 100 : null}
                    onChange={this._saveBankChange}>
                </input>
            </>
        }
        ))
        this.setState({
            data: currentData,
            edit: null,
            addNewBank: {
                BankValue: [],
            },
        })
    }
    _sortChange(e) {
        this.setState({
            sortBy: e.target.value,
        })
        this._sort();
    }
    _ascendingChange() {
        let newAcsendValue = !this.state.isAscending;
        this.setState({
            isAscending: newAcsendValue,
        })
        this._sort();
    }
    render() {
        if (!this.state.isNeedDisplayCalc) {
            return <><h1>Bank APP</h1>
                <div className='controlPanel'>
                    {
                        Button({
                            className: "addNewBank",
                            text: <FontAwesomeIcon icon="fa-solid fa-plus" />,
                            onClick: this._addNewBank,
                        })
                    }
                    <div className='sortByContainer'>
                        <label htmlFor="sortBy">Sort by</label>
                        <select name="sortBy" className='bankSelectDropDown' onChange={this._sortChange}>
                            {
                                this.props.headers.map((curHead, index) =>
                                    <><option key={index} value={index}>
                                        {curHead.name.toString()}
                                    </option></>)
                            }
                        </select>
                    </div>
                    {Button({
                        className: "Ascending",
                        text: this.state.isAscending ? <FontAwesomeIcon icon="fa-solid fa-arrow-up" /> : <FontAwesomeIcon icon="fa-solid fa-arrow-down" />,
                        onClick: this._ascendingChange,
                    })}
                </div>
                {
                    BankList({
                        header: this.props.headers,
                        data: this.state.data,
                        doubleClickFunc: this._displayEditor,
                        edit: this.state.edit,
                        dataSaveFunc: this._saveData,
                        deleteBankFunc: this._deleteBank,

                    })
                }
                <div className='buttonBlock'>
                {
                    Button({
                        className: "DisplayCalcButton",
                        text: "calculate",
                        onClick: this._displayCreditCalc
                    })
                }
                {
                    this.state.addNewBank ? Button({
                        className: "submitBankButton",
                        text: "save new bank",
                        onClick: this._saveData
                    }) : null
                }
                </div>
                {
                    this.state.saveBankError ? <><h3>Enter all bank data</h3></>: null
                }
                {
                    this.state.bankNumError ? <><h3>To open calculate enter at least 1 bank</h3></>:null
                }
            </>
        }
        return <>
            {CreditCalculator({
                data: this.state.data,
                calcValueSubmitFunc: this._calcValueSubmit,
                incorectInput: this.state.incorrectCalcInput,
                calcResult: this.state.calcResult,
                exitCalcFunc: this._displayCreditCalc
            })}
        </>
    }
}
App.defaultProps = {
    headers: [
        {
            name: "Bank name",
            type: "text",
            index: 0,
        },
        {
            name: "Interest rate",
            type: "number",
            isPercent: true,
            min: 0,
            index: 1,
        },
        {
            name: "Maximum loan",
            type: "number",
            isPercent: false,
            min: 0,
            index: 2,
        },
        {
            name: "Minimum down payment",
            type: "number",
            isPercent: true,
            min: 0,
            index: 3,
        },
        {
            name: "Loan term",
            type: "number",
            isPercent: false,
            min: 0,
            index: 4,
        }
    ],
}
root.render(
    <App />
)