import { VkAttachmentDescription, VkAttachmentReference, vkCreateRenderPass, vkDestroyRenderPass, VkRenderPass, VkRenderPassCreateInfo, VkSubpassDependency, VkSubpassDescription, VK_ACCESS_COLOR_ATTACHMENT_READ_BIT, VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT, VK_ATTACHMENT_LOAD_OP_CLEAR, VK_ATTACHMENT_LOAD_OP_DONT_CARE, VK_ATTACHMENT_STORE_OP_DONT_CARE, VK_ATTACHMENT_STORE_OP_STORE, VK_FORMAT_B8G8R8A8_UNORM, VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL, VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL, VK_IMAGE_LAYOUT_PRESENT_SRC_KHR, VK_IMAGE_LAYOUT_UNDEFINED, VK_PIPELINE_BIND_POINT_GRAPHICS, VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT, VK_SAMPLE_COUNT_1_BIT, VK_SUBPASS_EXTERNAL } from 'vulkan-api';
import { ASSERT_VK_RESULT } from '../utils/helpers';
import { LogicalDevice } from './logical.device';
import { RenderElement } from './render.element';

export class RenderPass extends RenderElement {

    private renderPass: VkRenderPass = new VkRenderPass();

    get handle() {
        return this.renderPass;
    }

    constructor(device: LogicalDevice) {

        super(device); 
        this.create();

    }

    protected onCreate() {
        this.renderPass = new VkRenderPass();
        let attachments = this.getAttachmentDesc();

        let renderPassInfo = new VkRenderPassCreateInfo();
        renderPassInfo.attachmentCount = attachments.length;
        renderPassInfo.pAttachments = attachments;
        renderPassInfo.subpassCount = 1;
        renderPassInfo.pSubpasses = [this.getSubPassDesc()];

        let deps = this.getSubpassDependency();

        renderPassInfo.dependencyCount = deps.length;
        renderPassInfo.pDependencies = deps;

        let result = vkCreateRenderPass(this.device.handle, renderPassInfo, null, this.renderPass);
        ASSERT_VK_RESULT(result);
    }

    protected onDestroy() {
        vkDestroyRenderPass(this.device.handle, this.renderPass, null);
    }

    getAttachmentDesc(): VkAttachmentDescription[] {
        let colorAttachment = new VkAttachmentDescription();
        colorAttachment.flags = 0;
        colorAttachment.format = VK_FORMAT_B8G8R8A8_UNORM;
        colorAttachment.samples = VK_SAMPLE_COUNT_1_BIT;
        colorAttachment.loadOp = VK_ATTACHMENT_LOAD_OP_CLEAR;
        colorAttachment.storeOp = VK_ATTACHMENT_STORE_OP_STORE;
        colorAttachment.stencilLoadOp = VK_ATTACHMENT_LOAD_OP_DONT_CARE;
        colorAttachment.stencilStoreOp = VK_ATTACHMENT_STORE_OP_DONT_CARE;
        colorAttachment.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
        colorAttachment.finalLayout = VK_IMAGE_LAYOUT_PRESENT_SRC_KHR;

        let depthAttachment = new VkAttachmentDescription();
        depthAttachment.flags = 0;
        depthAttachment.format = this.device.depthFormat;
        depthAttachment.samples = VK_SAMPLE_COUNT_1_BIT;
        depthAttachment.loadOp = VK_ATTACHMENT_LOAD_OP_CLEAR;
        depthAttachment.storeOp = VK_ATTACHMENT_STORE_OP_STORE;
        depthAttachment.stencilLoadOp = VK_ATTACHMENT_LOAD_OP_DONT_CARE;
        depthAttachment.stencilStoreOp = VK_ATTACHMENT_STORE_OP_DONT_CARE;
        depthAttachment.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
        depthAttachment.finalLayout = VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL;

        return [colorAttachment, depthAttachment];
    }

    getSubPassDesc() {

        let colorRef = new VkAttachmentReference();
        colorRef.attachment = 0;
        colorRef.layout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;

        let depthRef = new VkAttachmentReference();
        depthRef.attachment = 1;
        depthRef.layout = VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL;


        let subpassDescription = new VkSubpassDescription();
        subpassDescription.pipelineBindPoint = VK_PIPELINE_BIND_POINT_GRAPHICS;
        subpassDescription.inputAttachmentCount = 0;
        subpassDescription.pInputAttachments = null;
        subpassDescription.colorAttachmentCount = 1;
        subpassDescription.pColorAttachments = [colorRef];
        subpassDescription.pResolveAttachments = null;
        subpassDescription.pDepthStencilAttachment = depthRef;
        subpassDescription.preserveAttachmentCount = 0;
        subpassDescription.pPreserveAttachments = null;

        return subpassDescription;
    }

    getSubpassDependency() {

        let subpassDependency = new VkSubpassDependency();
        subpassDependency.srcSubpass = VK_SUBPASS_EXTERNAL;
        subpassDependency.dstSubpass = 0;
        subpassDependency.srcStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
        subpassDependency.dstStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
        subpassDependency.srcAccessMask = 0;
        subpassDependency.dstAccessMask = (
            VK_ACCESS_COLOR_ATTACHMENT_READ_BIT |
            VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT
        );
        subpassDependency.dependencyFlags = 0;


        return [subpassDependency];
    }
}