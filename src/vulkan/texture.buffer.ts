import { ASSERT_VK_RESULT, getMemoryTypeIndex } from "../utils/helpers";
import { VkImage, VkSampler, VkImageView, VkDeviceMemory, VkImageLayout, VK_IMAGE_LAYOUT_PREINITIALIZED, VkFormat, VkImageTiling, VkImageUsageFlagBits, VkMemoryPropertyFlagBits, VkImageCreateInfo, VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO, VK_IMAGE_TYPE_2D, VK_IMAGE_LAYOUT_UNDEFINED, VK_SAMPLE_COUNT_1_BIT, VK_SHARING_MODE_EXCLUSIVE, vkCreateImage, VkMemoryRequirements, vkGetImageMemoryRequirements, VkMemoryAllocateInfo, VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO, vkAllocateMemory, vkBindImageMemory, vkAllocateCommandBuffers, vkBeginCommandBuffer, VkBufferImageCopy, vkCmdCopyBufferToImage, vkCmdPipelineBarrier, VkCommandBuffer, VkCommandBufferAllocateInfo, VkCommandBufferBeginInfo, VkComponentMapping, vkCreateImageView, vkCreateSampler, vkEndCommandBuffer, VkExtent3D, VkImageMemoryBarrier, VkImageSubresourceLayers, VkImageSubresourceRange, VkImageViewCreateInfo, VkImageViewType, VkOffset3D, vkQueueSubmit, vkQueueWaitIdle, VkSamplerCreateInfo, VkSubmitInfo, VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_READ_BIT, VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT, VK_ACCESS_SHADER_READ_BIT, VK_ACCESS_TRANSFER_WRITE_BIT, VK_BORDER_COLOR_INT_OPAQUE_BLACK, VK_BUFFER_USAGE_TRANSFER_SRC_BIT, VK_COMMAND_BUFFER_LEVEL_PRIMARY, VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT, VK_COMPARE_OP_ALWAYS, VK_COMPONENT_SWIZZLE_IDENTITY, VK_FILTER_LINEAR, VK_FORMAT_D24_UNORM_S8_UINT, VK_FORMAT_D32_SFLOAT_S8_UINT, VK_FORMAT_R8G8B8A8_UNORM, VK_IMAGE_ASPECT_COLOR_BIT, VK_IMAGE_ASPECT_DEPTH_BIT, VK_IMAGE_ASPECT_STENCIL_BIT, VK_IMAGE_CREATE_CUBE_COMPATIBLE_BIT, VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, VK_IMAGE_TILING_OPTIMAL, VK_IMAGE_USAGE_SAMPLED_BIT, VK_IMAGE_USAGE_TRANSFER_DST_BIT, VK_IMAGE_VIEW_TYPE_2D, VK_IMAGE_VIEW_TYPE_CUBE, VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT, VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT, VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT, VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT, VK_PIPELINE_STAGE_TRANSFER_BIT, VK_QUEUE_FAMILY_IGNORED, VK_SAMPLER_ADDRESS_MODE_REPEAT, VK_SAMPLER_MIPMAP_MODE_LINEAR, VkImageAspectFlagBits, VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO, vkFreeMemory, vkDestroyImage, vkDestroyImageView } from "vulkan-api";
import { VulkanBuffer } from "./buffer";
import { CommandPool } from "./command.pool";
import { LogicalDevice } from "./logical.device";
import { PhysicalDevice } from "./physical.device";
import { RenderInstance } from './render.instance';

export class VulkanTextureBuffer {
    renderInstance: RenderInstance;


    image = new VkImage();
    depthImage = new VkImage();
    sampler = new VkSampler();
    imageView = new VkImageView();
    imageMemory = new VkDeviceMemory();
    imageLayout: VkImageLayout = VK_IMAGE_LAYOUT_PREINITIALIZED;
    stagingBuffer: VulkanBuffer | null = null;
    typeFormat: VkImageViewType = VK_IMAGE_VIEW_TYPE_2D;
    format: VkFormat = VK_FORMAT_R8G8B8A8_UNORM;

    constructor(renderInstance: RenderInstance) {
        this.renderInstance = renderInstance;
    }

    free(){
        vkDestroyImage(this.renderInstance.logicalDevice.handle, this.image, null);
        vkDestroyImageView(this.renderInstance.logicalDevice.handle, this.imageView, null);
    }

    createImageView(format: VkFormat, aspectFlags: VkImageAspectFlagBits) {
        let viewInfo = new VkImageViewCreateInfo();
        viewInfo.sType = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO;
        viewInfo.image = this.image;
        viewInfo.viewType = VK_IMAGE_VIEW_TYPE_2D;
        viewInfo.format = format;
        viewInfo.subresourceRange.aspectMask = aspectFlags;
        viewInfo.subresourceRange.baseMipLevel = 0;
        viewInfo.subresourceRange.levelCount = 1;
        viewInfo.subresourceRange.baseArrayLayer = 0;
        viewInfo.subresourceRange.layerCount = 1;

        this.format = format;

        let result = vkCreateImageView(
            this.renderInstance.logicalDevice.handle,
            viewInfo,
            null,
            this.imageView,
        );
        ASSERT_VK_RESULT(result);
    }

    upload(
        data: Uint8Array,
        width: number = 0,
        height: number = 0
    ) {
        let faces = this.typeFormat == VK_IMAGE_VIEW_TYPE_CUBE ? 6 : 1;

        let byteLength = data.byteLength;

        console.log('size is on upload: ' + byteLength);

        this.stagingBuffer = new VulkanBuffer(
            VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
            this.renderInstance.logicalDevice,
            this.renderInstance.physicalDevice,
            this.renderInstance.commandPool
        );
        this.stagingBuffer.create(
            byteLength,

            VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT |
            VK_MEMORY_PROPERTY_HOST_COHERENT_BIT,
        );
        this.stagingBuffer.updateValues(data);

        let imageExtent = new VkExtent3D();
        imageExtent.width = width;
        imageExtent.height = height;
        imageExtent.depth = 1;

        let imageInfo = new VkImageCreateInfo();
        imageInfo.imageType = VK_IMAGE_TYPE_2D;
        imageInfo.format = this.format;
        imageInfo.extent = imageExtent;
        imageInfo.mipLevels = 1;
        imageInfo.arrayLayers = faces;
        imageInfo.samples = VK_SAMPLE_COUNT_1_BIT;
        imageInfo.tiling = VK_IMAGE_TILING_OPTIMAL;
        imageInfo.usage =
            VK_IMAGE_USAGE_TRANSFER_DST_BIT | VK_IMAGE_USAGE_SAMPLED_BIT;
        imageInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
        imageInfo.queueFamilyIndexCount = 0;
        imageInfo.pQueueFamilyIndices = null;
        imageInfo.initialLayout = this.imageLayout;

        if (this.typeFormat == VK_IMAGE_VIEW_TYPE_CUBE)
            imageInfo.flags = VK_IMAGE_CREATE_CUBE_COMPATIBLE_BIT;

        let result = vkCreateImage(
            this.renderInstance.logicalDevice.handle,
            imageInfo,
            null,
            this.image,
        );
        ASSERT_VK_RESULT(result);

        let memoryRequirements = new VkMemoryRequirements();
        vkGetImageMemoryRequirements(
            this.renderInstance.logicalDevice.handle,
            this.image,
            memoryRequirements,
        );

        let memoryTypeIndex = getMemoryTypeIndex(
            memoryRequirements.memoryTypeBits,
            VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT,
            this.renderInstance.physicalDevice.handle,
        );

        let memoryAllocateInfo = new VkMemoryAllocateInfo();
        memoryAllocateInfo.allocationSize = memoryRequirements.size;
        memoryAllocateInfo.memoryTypeIndex = memoryTypeIndex;

        result = vkAllocateMemory(
            this.renderInstance.logicalDevice.handle,
            memoryAllocateInfo,
            null,
            this.imageMemory,
        );
        ASSERT_VK_RESULT(result);

        vkBindImageMemory(this.renderInstance.logicalDevice.handle, this.image, this.imageMemory, 0n);

        let offset = 0n;
        let buffercops: VkBufferImageCopy[] = [];
        for (let face = 0; face < faces; face++) {
            let imageSubresource = new VkImageSubresourceLayers();
            imageSubresource.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
            imageSubresource.mipLevel = 0;
            imageSubresource.baseArrayLayer = face;
            imageSubresource.layerCount = 1;

            let imageOffset = new VkOffset3D();
            imageOffset.x = 0;
            imageOffset.y = 0;
            imageOffset.z = 0;

            let imageExtent = new VkExtent3D();
            imageExtent.width = width;
            imageExtent.height = height;
            imageExtent.depth = 1;

            let bufferImageCopy = new VkBufferImageCopy();
            bufferImageCopy.bufferOffset = offset;
            bufferImageCopy.bufferRowLength = 0;
            bufferImageCopy.bufferImageHeight = 0;
            bufferImageCopy.imageSubresource = imageSubresource;
            bufferImageCopy.imageOffset = imageOffset;
            bufferImageCopy.imageExtent = imageExtent;

            buffercops.push(bufferImageCopy);
        }

        let subresourceRange = new VkImageSubresourceRange();
        subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
        subresourceRange.baseMipLevel = 0;
        subresourceRange.levelCount = 1;
        subresourceRange.baseArrayLayer = 0;
        subresourceRange.layerCount = faces;
        this.setNewLayout(
            VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
            subresourceRange,
        );
        this.transferBufferToImage(this.stagingBuffer, buffercops);
        this.setNewLayout(
            VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
            subresourceRange,
        );

        let components = new VkComponentMapping();
        components.r = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.g = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.b = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.a = VK_COMPONENT_SWIZZLE_IDENTITY;

        let imageViewInfo = new VkImageViewCreateInfo();
        imageViewInfo.image = this.image;
        imageViewInfo.viewType = this.typeFormat;
        imageViewInfo.format = this.format;
        //VK_FORMAT_R8_UNORM
        imageViewInfo.components = components;
        imageViewInfo.subresourceRange = subresourceRange;

        result = vkCreateImageView(
            this.renderInstance.logicalDevice.handle,
            imageViewInfo,
            null,
            this.imageView,
        );
        ASSERT_VK_RESULT(result);

        let samplerInfo = new VkSamplerCreateInfo();
        samplerInfo.magFilter = VK_FILTER_LINEAR;
        samplerInfo.minFilter = VK_FILTER_LINEAR;
        samplerInfo.mipmapMode = VK_SAMPLER_MIPMAP_MODE_LINEAR;
        samplerInfo.addressModeU = VK_SAMPLER_ADDRESS_MODE_REPEAT;
        samplerInfo.addressModeV = VK_SAMPLER_ADDRESS_MODE_REPEAT;
        samplerInfo.addressModeW = VK_SAMPLER_ADDRESS_MODE_REPEAT;
        //   samplerInfo.mipLodBias = 0;
        samplerInfo.anisotropyEnable = true;
        samplerInfo.maxAnisotropy = 16;
        samplerInfo.compareEnable = false;
        samplerInfo.compareOp = VK_COMPARE_OP_ALWAYS;
        // samplerInfo.minLod = 0;
        // samplerInfo.maxLod = 0;
        samplerInfo.borderColor = VK_BORDER_COLOR_INT_OPAQUE_BLACK;
        samplerInfo.unnormalizedCoordinates = false;

        result = vkCreateSampler(
            this.renderInstance.logicalDevice.handle,
            samplerInfo,
            null,
            this.sampler,
        );
        ASSERT_VK_RESULT(result);

        //this.data = null;
        //this.stagingBuffer.free();
    }

    setNewLayout(
        imageLayout: VkImageLayout,
        subresourceRange: VkImageSubresourceRange | null = null,
    ) {
        if (subresourceRange == null) {
            subresourceRange = new VkImageSubresourceRange();
            subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
            subresourceRange.baseMipLevel = 0;
            subresourceRange.levelCount = 1;
            subresourceRange.baseArrayLayer = 0;
            subresourceRange.layerCount = 1;
        }

        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = this.renderInstance.commandPool.handle;
        cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        cmdBufferAllocInfo.commandBufferCount = 1;

        let cmdBuffer = new VkCommandBuffer();
        let result = vkAllocateCommandBuffers(
            this.renderInstance.logicalDevice.handle,
            cmdBufferAllocInfo,
            [cmdBuffer],
        );
        ASSERT_VK_RESULT(result);

        let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
        cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
        cmdBufferBeginInfo.pInheritanceInfo = null;

        result = vkBeginCommandBuffer(cmdBuffer, cmdBufferBeginInfo);
        ASSERT_VK_RESULT(result);

        if (imageLayout == VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL) {
            subresourceRange.aspectMask = VK_IMAGE_ASPECT_DEPTH_BIT;
            if (
                this.format == VK_FORMAT_D32_SFLOAT_S8_UINT ||
                this.format == VK_FORMAT_D24_UNORM_S8_UINT
            ) {
                subresourceRange.aspectMask |= VK_IMAGE_ASPECT_STENCIL_BIT;
            }
        }

        let srcAccessMask = 0;
        let dstAccessMask = 0;
        let srcStage = 0;
        let dstStage = 0;
        if (
            imageLayout == VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL &&
            this.imageLayout == VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL
        ) {
            dstAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
            srcAccessMask = VK_ACCESS_SHADER_READ_BIT;
            dstStage = VK_PIPELINE_STAGE_TRANSFER_BIT;
            srcStage = VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT;
        }
        if (
            imageLayout === VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL &&
            this.imageLayout === VK_IMAGE_LAYOUT_PREINITIALIZED
        ) {
            srcAccessMask = 0;
            dstAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
            srcStage = VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT;
            dstStage = VK_PIPELINE_STAGE_TRANSFER_BIT;
        } else if (
            imageLayout === VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL &&
            this.imageLayout === VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL
        ) {
            srcAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
            dstAccessMask = VK_ACCESS_SHADER_READ_BIT;
            srcStage = VK_PIPELINE_STAGE_TRANSFER_BIT;
            dstStage = VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT;
        } else if (
            imageLayout === VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL &&
            this.imageLayout === VK_IMAGE_LAYOUT_UNDEFINED
        ) {
            srcAccessMask = 0;
            dstAccessMask =
                VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_READ_BIT |
                VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT;
            srcStage = VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT;
            dstStage = VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT;
        }

        let imageMemoryBarrier = new VkImageMemoryBarrier();
        imageMemoryBarrier.srcAccessMask = srcAccessMask;
        imageMemoryBarrier.dstAccessMask = dstAccessMask;
        imageMemoryBarrier.oldLayout = this.imageLayout;
        imageMemoryBarrier.newLayout = imageLayout;
        imageMemoryBarrier.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
        imageMemoryBarrier.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
        imageMemoryBarrier.image = this.image;
        imageMemoryBarrier.subresourceRange = subresourceRange;

        vkCmdPipelineBarrier(
            cmdBuffer,
            srcStage,
            dstStage,
            0,
            0,
            null,
            0,
            null,
            1,
            [imageMemoryBarrier],
        );

        result = vkEndCommandBuffer(cmdBuffer);
        ASSERT_VK_RESULT(result);

        let submitInfo = new VkSubmitInfo();
        submitInfo.waitSemaphoreCount = 0;
        submitInfo.pWaitSemaphores = null;
        submitInfo.pWaitDstStageMask = null;
        submitInfo.commandBufferCount = 1;
        submitInfo.pCommandBuffers = [cmdBuffer];
        submitInfo.signalSemaphoreCount = 0;
        submitInfo.pSignalSemaphores = null;

        vkQueueSubmit(this.renderInstance.logicalDevice.handleQueue, 1, [submitInfo], null);
        vkQueueWaitIdle(this.renderInstance.logicalDevice.handleQueue);

        this.imageLayout = imageLayout;
    }


    transferBufferToImage(buffer: VulkanBuffer, buffcops: VkBufferImageCopy[]) {
        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = this.renderInstance.commandPool.handle;
        cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        cmdBufferAllocInfo.commandBufferCount = 1;

        let cmdBuffer = new VkCommandBuffer();
        let result = vkAllocateCommandBuffers(
            this.renderInstance.logicalDevice.handle,
            cmdBufferAllocInfo,
            [cmdBuffer],
        );
        ASSERT_VK_RESULT(result);

        let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
        cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
        cmdBufferBeginInfo.pInheritanceInfo = null;

        result = vkBeginCommandBuffer(cmdBuffer, cmdBufferBeginInfo);
        ASSERT_VK_RESULT(result);

        vkCmdCopyBufferToImage(
            cmdBuffer,
            buffer.buffer,
            this.image,
            VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
            buffcops.length,
            buffcops,
        );

        result = vkEndCommandBuffer(cmdBuffer);
        ASSERT_VK_RESULT(result);

        let submitInfo = new VkSubmitInfo();
        submitInfo.waitSemaphoreCount = 0;
        submitInfo.pWaitSemaphores = null;
        submitInfo.pWaitDstStageMask = null;
        submitInfo.commandBufferCount = 1;
        submitInfo.pCommandBuffers = [cmdBuffer];
        submitInfo.signalSemaphoreCount = 0;
        submitInfo.pSignalSemaphores = null;

        vkQueueSubmit(this.renderInstance.logicalDevice.handleQueue, 1, [submitInfo], null);
        vkQueueWaitIdle(this.renderInstance.logicalDevice.handleQueue);
    }

    create(
        format: VkFormat,
        tiling: VkImageTiling,
        usage: VkImageUsageFlagBits,
        properties: VkMemoryPropertyFlagBits,
    ) {
        let imageInfo = new VkImageCreateInfo();
        imageInfo.sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO;
        imageInfo.imageType = VK_IMAGE_TYPE_2D;
        imageInfo.extent.width = this.renderInstance.window.width;
        imageInfo.extent.height =  this.renderInstance.window.height;
        imageInfo.extent.depth = 1;
        imageInfo.mipLevels = 1;
        imageInfo.arrayLayers = 1;
        imageInfo.format = format;
        imageInfo.tiling = tiling;
        imageInfo.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
        imageInfo.usage = usage;
        imageInfo.samples = VK_SAMPLE_COUNT_1_BIT;
        imageInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;

        let result = vkCreateImage(
            this.renderInstance.logicalDevice.handle,
            imageInfo,
            null,
            this.image,
        );
        ASSERT_VK_RESULT(result);

        let memRequirements = new VkMemoryRequirements();
        vkGetImageMemoryRequirements(
            this.renderInstance.logicalDevice.handle,
            this.image,
            memRequirements,
        );

        let allocInfo = new VkMemoryAllocateInfo();
        allocInfo.sType = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO;
        allocInfo.allocationSize = memRequirements.size;
        allocInfo.memoryTypeIndex = getMemoryTypeIndex(
            memRequirements.memoryTypeBits,
            properties,
            this.renderInstance.physicalDevice.handle,
        );

        result = vkAllocateMemory(
            this.renderInstance.logicalDevice.handle,
            allocInfo,
            null,
            this.imageMemory,
        );
        ASSERT_VK_RESULT(result);

        vkBindImageMemory(
            this.renderInstance.logicalDevice.handle,
            this.image,
            this.imageMemory,
            0n,
        );
        this.imageLayout = VK_IMAGE_LAYOUT_UNDEFINED;
    }
}