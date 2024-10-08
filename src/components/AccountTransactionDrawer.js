import { FallOutlined, RiseOutlined } from '@ant-design/icons';
import { Drawer, List, Tag } from 'antd';
import Decimal from 'decimal.js';
import { Component, Fragment } from 'react';
import { fetch, formatCurrency, getAccountIcon } from '../config/Util';
import AccountAmount from './AccountAmount';
import AccountIcon from './AccountIcon';
import MonthSelector from './MonthSelector';

class AccountTransactionDrawer extends Component {

  state = {
    transactions: [],
    selectedMonth: "",
    loading: false,
  }

  componentDidMount() {
    if (this.props.account) {
      this.handleQueryAccountTransaction(this.props.account)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.visible) {
      this.handleQueryAccountTransaction(nextProps.account)
    }
  }

  handleQueryAccountTransaction = (account) => {
    if (!account) return;
    this.setState({ loading: true })

    let year, month;
    if (this.state.selectedMonth) {
      const yearAndMonth = this.state.selectedMonth.split('-').filter(a => a)
      if (yearAndMonth.length === 1) {
        year = yearAndMonth[0]
      } else if (yearAndMonth.length === 2) {
        year = yearAndMonth[0]
        month = yearAndMonth[1]
      }
    }

    fetch(`/api/auth/transaction?account=${account}&year=${year}&month=${month}`)
      .then(transactions => {
        this.setState({ transactions })
      }).catch(console.error).finally(() => { this.setState({ loading: false }) })
  }

  handleChangeMonth = (selectedMonth) => {
    this.setState({ selectedMonth }, () => {
      this.handleQueryAccountTransaction(this.props.account)
    })
  }

  render() {
    const editAccount = this.props.account
    const { transactions, loading } = this.state
    return (
      <Drawer
        title={<div style={{ fontSize: 14 }}><div>{editAccount}</div><div>最近{transactions.length}条交易记录</div></div>}
        placement="bottom"
        closable={true}
        className="page-drawer"
        height="90vh"
        bodyStyle={{ display: 'flex', justifyContent: 'center' }}
        {
        ...this.props
        }
      >
        <div className="page-form">
          <MonthSelector size="middle" value={this.state.selectedMonth} onChange={this.handleChangeMonth} />
          <List
            itemLayout="horizontal"
            loading={loading}
            dataSource={transactions}
            renderItem={item => {
              // 是否是投资账户
              const isInvestAccount = item.costCurrency && (item.currency !== item.costCurrency)
              const isSale = Boolean(item.price)
              let costAmount
              let investProfit
              if (isInvestAccount) {
                costAmount = Decimal(item.costPrice).mul(Decimal(item.number).abs())
                if (isSale) {
                  investProfit = Decimal(item.price).sub(Decimal(item.costPrice)).mul(Decimal(item.number).abs())
                }
              }
              return (
                <List.Item
                  actions={[
                    <div style={{ textAlign: 'right' }}>
                      <div>{item.number ? AccountAmount(editAccount, item.number, item.currencySymbol, item.currency) : ''}</div>
                      <div style={{ fontSize: '12px' }}>{formatCurrency(item.balance, this.props.commodity)}</div>
                    </div>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<AccountIcon iconType={getAccountIcon(editAccount)} />}
                    title={item.desc}
                    description={
                      <div>
                        {item.tags && <div>{item.tags.map(t => <a style={{ marginRight: '4px' }}>#{t}</a>)}</div>}
                        <span>{item.date}&nbsp;{item.payee}&nbsp;{item.commodity}</span>
                        {
                          isInvestAccount &&
                          <div style={{ marginTop: '13px' }}>
                            {
                              isSale ?
                                <Fragment>
                                  <Tag>持仓成本: {item.costPrice} ({item.costDate})</Tag>
                                  <Tag>确认净值: {item.price}</Tag>
                                  {
                                    investProfit >= 0 ?
                                      <Fragment>
                                        <Tag icon={<RiseOutlined />} color="#f50">{(100 * Number(investProfit) / Number(costAmount)).toFixed(2)}%</Tag>
                                        <Tag color="#f50">+{Math.abs(investProfit).toFixed(2)}</Tag>
                                      </Fragment> :
                                      <Fragment>
                                        <Tag icon={<FallOutlined />} color="#1DA57A">{(100 * Number(investProfit) / Number(costAmount)).toFixed(2)}%</Tag>
                                        <Tag color="#1DA57A">-{Math.abs(investProfit).toFixed(2)}</Tag>
                                      </Fragment>
                                  }
                                </Fragment> :
                                <Fragment>
                                  <Tag>{item.isAnotherCurrency ? '汇率' : '购入净值'}: {item.costPrice}</Tag>
                                  {/* <Tag>持仓: {item.costPrice} / {AccountAmount(editAccount, costAmount, item.costCommoditySymbol)}</Tag> */}
                                </Fragment>
                            }
                          </div>
                        }
                      </div>
                    }
                  />
                </List.Item>
              )
            }}
          />
        </div>
      </Drawer>
    )
  }
}


export default AccountTransactionDrawer