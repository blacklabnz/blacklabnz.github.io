---
title: "Azure networking: Hub and spoke topology with terraform"
date: "2022-04-11"
draft: false
tags: ["terraform", "hub and spoke", "private endpoints", "azure firewall", "forced tunneling"]
categories: ["networking", "security"]
---
The hub and spoke topology has been widely adopted for enterprise production deployment.
In this lab, let put on our network/infrastructure engineer hat and get our hand dirty on Azure Hub and spoke topology with one of the popular IaC -- Terraform.
Lets have a look at the high level architecture first.
## Overall architecture of the lab
![hubandspoke]({{< get_image_link image_name="hub-spoke.png" >}})
The essence of the topology is, by the name of it, having all traffic routed to hub before it gets forwarded to spoke. In hub network Azure firewall will be deployed, processing and logging all the traffic. 
In spoke user defined route is configured to route the traffic to hub, one the traffic arrives hub and processed by firewall, policy will be applied depending on the requirement to either allow or deny.
We don't have the luxury to have a on-prem VPN device with a VPN connection or express route, hence we are using another vNet and connect that to the hub via vNet gateway to simulate traffic passing through a gateway.
Please refer to the following table for address spaces for each of the vent.
| vnet              | address space | subnet                        | address prefix  |
| :---              | :----         | :---                          | :---            |
| blk-hub           | 10.0.0.0/16   | GatewaySubnet                 | 10.0.1.0/24     |
|                   |               | AzureFirewallSubnet           | 10.0.2.0/24     |
|                   |               | AzureFirewallManagementSubnet | 10.0.3.0/24     |
|                   |               | jump                          | 10.0.3.0/24     |
| blk-spoke-a       | 10.1.0.0/16   | app                           | 10.1.1.0/24     |
| blk-spoke-b       | 10.2.0.0/16   | app                           | 10.2.1.0/24     |
| blk-spoke-onprem  | 192.168.1.0/24| GatewaySubnet                 | 192.168.1.0/26  |
|                   |               | GatewaySubnet                 | 192.168.1.64/26 |

Once we have the network all setup we will manually create some VMs to do some ping tests and the analyze the firewall logs using Azure Log analytics.
Without further ado let dive into each part.

### Project setup
The following represents the file structures we have in the project.
```bash
├── README.md
├── data.tf
├── main.tf
├── output.tf
├── providers.tf
├── values.tfvars
├── variables.tf
└── .gitignore
```
For simplifying our demo, we are going to put all our terraform resources in the main.tf file. In real world development, the best practice would be modularize any components that are reusable.
We are also simplifying the terraform variables with locals, you will find the only the authentication related values are kept in variables whose values get passed in from values.tfvars file. 

For your convenience, you can download tf module required for this lab from my github repo: [networking-hub-spoke](https://github.com/blacklabnz/networking-hub-spoke-terraform) 

First thing before carry on to the next part is to setup the providers. 

> providers.tf
```bash
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "2.97.0"
    }
    databricks = {
      source  = "databrickslabs/databricks"
      version = "0.5.1"
    }
    external = {
      source  = "hashicorp/external"
      version = "2.2.2"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
}
```
### Quick explanation
We use service principal to authenticate to azure, in here we use variables to represent the value so that later on we can specify the values.tfvars file and pass the value in. This is really handy if you need to deal with multiple Azure environment that has different auth service principals. Refer the official doc [here](https://www.terraform.io/language/values/variables).

To be able to use variables we will need to add the following to the variables file:

> variable.tf
```bash
variable "subscription_id" {
  type = string
  default = "default"
} 
variable "client_id" {
  type = string
  default = "default"
}
variable "client_secret" {
  type = string
  default = "default"
}   
variable "tenant_id" {
  type = string
  default = "default"
}       
```
Lastly you will need to create a service principal that has contributor access to the subscription that you are about to deploy to. You can find more details in this office [doc](https://docs.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli). 
Once Service principal is created you will need to create a secret and use that alone side with the application id to authentication to Azure. When finished, please create a values.tfvars file where you could input those required auth information for terraform to pass in as variables. The information required are: 
1. subscription id 
2. service principal client id
3. service principal client secret
4. azure tenant id.

> values.tfvars
```bash
subscription_id = "xxxxxxxxx"
client_id       = "xxxxxxxxx"
client_secret   = "xxxxxxxxx"
tenant_id       = "xxxxxxxxx"
```
At this point we will need to initiate our terraform workspace by running:
```bash
terraform init
```
With that all set, lets move on to next part of creating actual resources.

## Part 1 Create all vNets and subnets
In this part we will create all the vNets and subnets associated with it. We will also create the peerings for each of the vNets.

### 1.1 Create vNet
First we will need to add some variables in the locals block as mentioned previously.
{{< note >}}
To simplify our lab setup, I am not creating any NSG, I'd encourage to embrace Security and add NSG if you are implementing this in a work environment.
{{< /note >}}
Because some of our resources are repetitive in nature, and I could confess that I am lazy, I will use tf for_loop instead of copying/pasting similar code.

Please add the first block of locals in your file.
> main.tf
```bash
locals {
  org         = "blk"
  rg          = "${local.org}-hub-spoke"
  rg_location = "australiaeast"

  vnets = {
    vnet_hub    = { name = "${local.org}-hub", address_space = "10.0.0.0/16" }
    vnet_a      = { name = "${local.org}-spoke-a", address_space = "10.1.0.0/16" }
    vnet_b      = { name = "${local.org}-spoke-b", address_space = "10.2.0.0/16" }
    vnet_onprem = { name = "${local.org}-spoke-onprem", address_space = "192.168.1.0/24" }
  }
}
```
### Quick explanation
Just wanted to quick go through how I setup the variables for all vNets. The vnets is a map object, essentially a key-value pair structure. If we look at the information of vent name and address spaces as the value of each of the vent properties, then the key would be the reference name of each of the vent property object. The information about each of the vent is grouped in such way that it can be iterated through the map object they form. 
when tf uses the vnet variable it would simply go into the value of eac key-value pair and retrieve the data from there.

Lets add the following to your main.tf and start creating first the resource group and the vNets
```bash
resource "azurerm_resource_group" "hub_spoke" {
  name     = local.rg
  location = local.rg_location
}

resource "azurerm_virtual_network" "hub_spoke" {
  for_each            = local.vnets
  name                = each.value["name"]
  location            = local.rg_location
  resource_group_name = azurerm_resource_group.hub_spoke.name
  address_space       = [each.value["address_space"]]
  depends_on          = [azurerm_resource_group.hub_spoke]
}
```
### Quick explanation
In the second block we assign local.vnets which is map object to for_each expression, the expression is able to take each of the key-value pair and starting using them in the properties following it. You could then refer to each of the object in map by referring to key words each with syntax as the following:
```
name = each.value["name"]
``` 
The "each" keyword effectively points to every single key-value pair, the first one being
```
vnet_hub = { name = "${local.org}-hub", address_space = "10.0.0.0/16" }
```
In this "each" object, the "key" is "vnet_hub" and the "value" is "{ name = "${local.org}-hub", address_space = "10.0.0.0/16" }", therefore if I need the "name" property in the "value" inside each of the object, I would have "each.value["name"]". Please refer to tf [doc](https://www.terraform.io/language/meta-arguments/for_each) for more information on for_each.

With this all set, lets run our tf and deploy the resource for the first time.
Simply go:
```
terraform plan -var-file=values.tfvars
```
followed by 
```bash
terraform apply -auto-approve -var-file=values.tfvars
```
If all sets up correctly, you should be able to see all the required vNet being created in the resource group.

### 1.2 Create subnets
They way subnets are created is pretty much similar to how vents were created, using for_each expression.
add the following to you locals in you main.tf file
> main.tf 
```bash 
subnets = {
  hub_gw            = { vnet = "${local.org}-hub", name = "GatewaySubnet", address_prefixes = "10.0.1.0/24" }
  hub_firewall      = { vnet = "${local.org}-hub", name = "AzureFirewallSubnet", address_prefixes = "10.0.2.0/24" }
  hub_firewall_mgmt = { vnet = "${local.org}-hub", name = "AzureFirewallManagementSubnet", address_prefixes = "10.0.3.0/24" }
  hub_jumphost      = { vnet = "${local.org}-hub", name = "jump", address_prefixes = "10.0.4.0/24" }
  a_app             = { vnet = "${local.org}-spoke-a", name = "app", address_prefixes = "10.1.1.0/24" }
  b_app             = { vnet = "${local.org}-spoke-b", name = "app", address_prefixes = "10.2.1.0/24" }
  onprem_gw         = { vnet = "${local.org}-spoke-onprem", name = "GatewaySubnet", address_prefixes = "192.168.1.0/26" }
  onprem_app        = { vnet = "${local.org}-spoke-onprem", name = "app", address_prefixes = "192.168.1.64/26" }
}
```
Add the following resources to our main.tf as well
> main.tf 
```bash
resource "azurerm_subnet" "hub-spoke" {
  for_each                                       = local.subnets
  name                                           = each.value["name"]
  resource_group_name                            = local.rg
  virtual_network_name                           = each.value["vnet"]
  address_prefixes                               = [each.value["address_prefixes"]]
  enforce_private_link_endpoint_network_policies = true

  depends_on = [azurerm_virtual_network.hub_spoke]
}
```
Again run:
```
terraform plan -var-file=values.tfvars
```
followed by 
```bash
terraform apply -auto-approve -var-file=values.tfvars
```
If all sets up correctly, you should be able to see all the required subnets created inside our vnets.

### 1.3 Create peerings between vNets
Lets create the peerings as well to wire up the spoke vents with hub vnets.
Add the following vars in you locals
> main.tf
```bash
peering = {
  hub_to_spoke_a = { name = "${local.vnets.vnet_hub.name}-to-${local.vnets.vnet_a.name}", vnet = "vnet_hub", remote = "vnet_a", use_remote_gw = false }
  spoke_a_to_hub = { name = "${local.vnets.vnet_a.name}-to-${local.vnets.vnet_hub.name}", vnet = "vnet_a", remote = "vnet_hub", use_remote_gw = true }
  hub_to_spoke_b = { name = "${local.vnets.vnet_hub.name}-to-${local.vnets.vnet_b.name}", vnet = "vnet_hub", remote = "vnet_b", use_remote_gw = false }
  spoke_b_to_hub = { name = "${local.vnets.vnet_b.name}-to-${local.vnets.vnet_hub.name}", vnet = "vnet_b", remote = "vnet_hub", use_remote_gw = true }
}
```
as well as the following resources:
> main.tf
```bash 
resource "azurerm_virtual_network_peering" "hub_to_spoke_a" {
  for_each                     = local.peering
  name                         = each.value["name"]
  resource_group_name          = local.rg
  virtual_network_name         = azurerm_virtual_network.hub_spoke[each.value["vnet"]].name
  remote_virtual_network_id    = azurerm_virtual_network.hub_spoke[each.value["remote"]].id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = true
  use_remote_gateways          = each.value["use_remote_gw"]
}
```
Let now run terraform plan and terraform apply to create the peering, please follow steps in previous part for the code snippet.
Once done we should be able to validate the peering connection by inspecting the connection status.
![peering]({{< get_image_link image_name="peering.png" >}})

### 1.3 Create firewall instance
Next up lets create the firewall instance. The firewall instance we created has the forced tunneling option enabled. Please refer to Microsoft [doc](https://docs.microsoft.com/en-us/azure/firewall/forced-tunneling) for more information on the tunneling option. With this option you will need a additional subnets in the hub vnet with is designated as the management subnet.
### 1.4 Create firewall policies
## Part 2 Spoke networks and peering to hub
### 2.1 Create vNets and subnets 
### 2.2 Setup peering to vNet
## Part 3 Another virtual network simulating on-prem via VPN
### 3.1 Create vNets and subnets
### 3.2 Create vNet to vNet VPN
## Part 4 Create some VMs to validate the traffic
### 4.1 Create some VMs
### 4.2 Ping tests 
## Part 5 Azure log analytics analysis